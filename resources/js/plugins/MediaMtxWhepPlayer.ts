type WhepPlayerOptions = {
    /** Optional: override derived WHEP URL. Example: "https://host/whep/aqms11" */
    whepUrl?: string;
    /** Optional: ICE servers untuk RTCPeerConnection */
    rtcConfig?: RTCConfiguration;
    /** Auto-play muted agar lolos policy browser */
    muted?: boolean;
    /** Optional: log detail ke console */
    debug?: boolean;
    /** Optional: kredensial HTTP (mis. Basic) jika WHEP protected */
    fetchInit?: Omit<RequestInit, "method" | "body" | "headers"> & { headers?: HeadersInit };
};

export class MediaMtxWhepPlayer {
    private videoEl: HTMLVideoElement;
    private options: WhepPlayerOptions;
    private pc: RTCPeerConnection | null = null;
    private whepResourceUrl: string | null = null; // from Location header
    private remoteStream: MediaStream | null = null;
    private playingUrl: string | null = null;

    constructor(videoEl: HTMLVideoElement, options: WhepPlayerOptions = {}) {
        this.videoEl = videoEl;
        this.options = options;

        // Autoplay policy: set default attributes
        this.videoEl.autoplay = true;
        this.videoEl.playsInline = true;
        this.videoEl.muted = options.muted ?? true;
        // Helpful defaults (you can style via CSS)
        this.videoEl.controls = this.videoEl.controls || false;
    }

    /** Main entry: play a MediaMTX stream.
     * Accepts either the /whep/<path> URL or the /rtc/<path>/ page URL. */
    async play(url: string): Promise<void> {
        await this.stop(); // clean any previous session
        this.playingUrl = url;

        const whepUrl = this.options.whepUrl ?? this.deriveWhepUrl(url);
        if (!whepUrl) throw new Error("Cannot derive WHEP URL. Provide options.whepUrl explicitly.");

        if (this.options.debug) console.log("[WHEP] using", whepUrl);

        // 1) Create PeerConnection
        const rtcConfig: RTCConfiguration = this.options.rtcConfig ?? {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        };
        this.pc = new RTCPeerConnection(rtcConfig);

        // 2) Prepare remote stream
        this.remoteStream = new MediaStream();
        this.videoEl.srcObject = this.remoteStream;

        this.pc.addEventListener("track", (ev) => {
            if (this.options.debug) console.log("[WHEP] ontrack", ev.track.kind);
            this.remoteStream?.addTrack(ev.track);
        });

        this.pc.addEventListener("connectionstatechange", () => {
            if (this.options.debug) console.log("[WHEP] connectionstate", this.pc?.connectionState);
            if (this.pc?.connectionState === "failed") {
                // Optional: try ICE restart or notify UI
            }
        });

        // 3) For WHEP, create recvonly transceivers for media types you expect
        this.pc.addTransceiver("video", { direction: "recvonly" });
        this.pc.addTransceiver("audio", { direction: "recvonly" });

        // 4) Create SDP offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // 5) POST offer.sdp to WHEP endpoint
        const resp = await fetch(whepUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/sdp",
                Accept: "application/sdp",
                ...(this.options.fetchInit?.headers ?? {}),
            },
            body: offer.sdp ?? "",
            ...this.stripHeaders(this.options.fetchInit),
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`WHEP offer failed: ${resp.status} ${resp.statusText} ${text}`);
        }

        // 6) Read answer SDP and WHEP resource URL (Location header)
        const answerSdp = await resp.text();
        const location = resp.headers.get("Location");
        if (!answerSdp) throw new Error("Empty SDP answer from WHEP server.");
        this.whepResourceUrl = location; // Used for DELETE on stop

        await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        // 7) Try to start playback (autoplay)
        await this.safePlayVideo();
    }

    /** Stop and cleanup */
    async stop(): Promise<void> {
        // DELETE WHEP resource if we have a Location
        if (this.whepResourceUrl) {
            try {
                await fetch(this.whepResourceUrl, {
                    method: "DELETE",
                    ...(this.stripHeaders(this.options.fetchInit)),
                });
            } catch (e) {
                if (this.options.debug) console.warn("[WHEP] DELETE failed:", e);
            }
        }
        this.whepResourceUrl = null;

        if (this.pc) {
            try {
                this.pc.getSenders().forEach((s) => s.track && s.track.stop());
                this.pc.getReceivers().forEach((r) => r.track && r.track.stop());
                this.pc.close();
            } catch {}
            this.pc = null;
        }
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((t) => t.stop());
            this.remoteStream = null;
        }
        if (this.videoEl.srcObject) {
            this.videoEl.srcObject = null;
        }
        this.playingUrl = null;
    }

    /** Change stream without recreating the player instance */
    async switchStream(newUrlOrWhep: string, explicitWhepUrl?: string): Promise<void> {
        // stop current, then play the new one
        await this.stop();
        // keep same instance options
        this.options = {
            ...this.options,
            whepUrl: explicitWhepUrl ?? this.deriveWhepUrl(newUrlOrWhep) ?? this.options.whepUrl,
        };
        await this.play(newUrlOrWhep);
    }

    /** Set audio output device if supported (Chrome) */
    async setAudioOutputDevice(deviceId: string): Promise<void> {
        const anyVideo = this.videoEl as any;
        if (typeof anyVideo.setSinkId === "function") {
            await anyVideo.setSinkId(deviceId);
        } else {
            throw new Error("setSinkId is not supported in this browser.");
        }
    }

    get isPlaying(): boolean {
        return !!this.pc && this.pc.connectionState !== "closed";
    }

    /** Helper: derive /whep/ URL from MediaMTX /rtc/ or direct path */
    private deriveWhepUrl(input: string): string | null {
        try {
            const u = new URL(input);
            // If already /whep/, keep as is
            if (u.pathname.startsWith("/whep/")) return u.toString();

            // Convert common MediaMTX patterns:
            // - /rtc/<path>/  → /whep/<path>
            // - /rtc/<path>   → /whep/<path>
            // - /&params      → stripped (WHEP normally has no query)
            const parts = u.pathname.split("/").filter(Boolean);
            const rtcIdx = parts.indexOf("rtc");
            if (rtcIdx >= 0 && parts.length > rtcIdx + 1) {
                const streamPath = parts.slice(rtcIdx + 1).join("/");
                u.pathname = `/whep/${streamPath}`;
                u.search = "";
                return u.toString().replace(/\/+$/, ""); // trim trailing slash
            }

            // If user passed something like base URL, we can’t guess
            return null;
        } catch {
            return null;
        }
    }

    private async safePlayVideo(): Promise<void> {
        try {
            await this.videoEl.play();
        } catch (err) {
            // Autoplay might be blocked if not muted
            if (this.options.debug) console.warn("[WHEP] video.play() blocked:", err);
            // Caller can show a "Tap to Play" UI; on user gesture, call videoEl.play()
        }
    }

    /** Keep only non-header fields from fetchInit; headers are passed explicitly */
    private stripHeaders(init?: WhepPlayerOptions["fetchInit"]): RequestInit | undefined {
        if (!init) return undefined;
        const { headers: _omit, ...rest } = init;
        return rest;
    }
}
