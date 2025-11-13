<x-guest-layout>
    <div id="app" class="relative flex flex-col min-h-screen w-full overflow-hidden">
        <!-- Ambient particles -->
        <div id="particles" class="particles pointer-events-none absolute inset-0 -z-10"></div>

        <!-- Header / Logo -->
        <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                    <!-- Icon: Leaf -->
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21s5-5 9-5 9-4 9-9C13 7 7 3 3 21Z" />
                    </svg>
                </div>
                <div>
                    <div class="text-xl font-bold tracking-tight !text-white">Be Enviro</div>
                    <div class="text-[11px] uppercase tracking-widest text-white">Sparing • AQMS</div>
                </div>
            </div>
            <nav class="items-center gap-6 text-sm text-white flex">
                <a class="transition-colors hover:text-emerald-700" href="#features">Features</a>
                <a class="transition-colors hover:text-emerald-700" href="#access">Access</a>
                <a class="transition-colors hover:text-emerald-700" href="#support">Support</a>
            </nav>
        </header>

        <main class="flex-grow flex items-center justify-center">
            <div class="mx-auto grid w-full max-w-6xl sm:grid-cols-1 grid-cols-2 items-center gap-10 px-6 pb-14 pt-4 md:grid-cols-2 md:gap-12 md:pt-10">
                <!-- Left: Hero copy -->
                <section class="animate-fadeInUp sm:hidden">
                    <h1 class="text-5xl font-extrabold leading-tight tracking-tight md:text-5xl text-white">
                        Environmental
                        <div class="flex items-center">
                            Monitoring
                            <div class="bg-white/50 px-2 rounded-xl ml-2">
                                <span class="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent"> Made Easier</span>
                            </div>
                        </div>
                    </h1>
                    <p class="mt-4 max-w-xl text-base leading-relaxed text-white">
                        Consolidated access to <strong>SPARING</strong> and <strong>AQMS</strong> in one place.
                    </p>

                    <div id="features" class="mt-6 flex flex-wrap items-center gap-3 text-xs">
                        <span class="badge badge-solid">Realtime</span>
                        <span class="badge badge-secondary">Role-based</span>
                    </div>

                    <div class="mt-10 text-white md:block">
                        <div class="flex items-center gap-6">
                            <div class="flex items-center gap-2">
                                <!-- Icon: Wind -->
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12h10a3 3 0 1 0-3-3" />
                                    <path d="M3 18h14a3 3 0 1 1-3 3" />
                                </svg>
                                AQ Monitoring
                            </div>
                            <div class="flex items-center gap-2">
                                <!-- Icon: Waves -->
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
                                    <path d="M3 18c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
                                </svg>
                                Wastewater (SPARING)
                            </div>
                            <div class="flex items-center gap-2">
                                <!-- Icon: Shield -->
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                </svg>
                                Compliance
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Right: Login card -->
                <section class="animate-fadeInUp animation-delay-50">
                    <div class="2xl:ml-auto md:ml-auto xl:ml-auto lg:ml-auto card overflow-hidden sm:w-full w-[70%]">
                        <div class="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-sky-400/10"></div>
                        <div class="card-header !items-start !flex-col">
                            <div class="card-title text-2xl flex items-center gap-2">
                                <div class="inline-flex h-12 w-20 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                    <!-- Icon: Login -->
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <path d="M10 17l5-5-5-5" />
                                        <path d="M15 12H3" />
                                    </svg>
                                </div>
                                <div>
                                    <div>Login to Account</div>
                                    <div class="leading-4 text-[13px] font-normal text-slate-500">Use your credentials to access the module according to your access rights.</div>
                                </div>
                            </div>
                        </div>

                        <div class="card-content">
                            <form id="loginForm" method="POST" action="{{ route('login') }}" class="space-y-4">
                                @csrf
                                <div class="form-group">
                                    <label> Username / Email </label>
                                    <div class="form-group-control !bg-white">
                                        <div class="form-control-prepend">
                                            <div class="form-control-prepend-text">
                                                <i class="fa fa-envelope"></i>
                                            </div>
                                        </div>
                                        <input type="text" name="email" class="form-control input email" placeholder="name@mail.com"/>
                                    </div>
                                    @if(count($errors) != 0 && isset($errors->get('email')[0]))
                                        <div class="info-alert-text error errorEmail">
                                            <i class="fas fa-exclamation-circle"></i>
                                            <div class="errorEmailText">{{$errors->get('email')[0]}}</div>
                                        </div>
                                    @endif
                                </div>
                                <div class="form-group">
                                    <label> Password </label>
                                    <div class="form-group-control !bg-white">
                                        <div class="form-control-prepend">
                                            <div class="form-control-prepend-text">
                                                <i class="fa fa-lock"></i>
                                            </div>
                                        </div>
                                        <input type="password" name="password" class="form-control passw" placeholder="··················"/>
                                        <div class="form-control-append">
                                            <div class="form-control-append-text">
                                                <a class="show-pass btnLookPass">
                                                    <i class="fas fa-eye-slash"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    @if(count($errors) != 0 && isset($errors->get('password')[0]))
                                        <div class="info-alert-text error errorPassword">
                                            <i class="fas fa-exclamation-circle"></i>
                                            <div class="errorPasswordText">{{$errors->get('password')[0]}}</div>
                                        </div>
                                    @endif
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox"  name="remember" class="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                                        <span class="text-slate-600">{{ __('Remember me') }}</span>
                                    </label>
                                    <a href="#support" class="hidden text-emerald-700 hover:underline">Forgot Password?</a>
                                </div>
                                <button id="submitBtn" type="submit" class="btn w-full">Login</button>
                            </form>

                            <!-- Post-login access grid -->
                            <div id="access" class="mt-6 hidden">
                                <div class="mb-3 text-sm text-slate-500">Hak akses terdeteksi:</div>
                                <div class="mb-4 flex flex-wrap gap-2">
                                    <span id="badgeSPARING" class="badge badge-outline">SPARING</span>
                                    <span id="badgeAQMS" class="badge badge-outline">AQMS</span>
                                </div>

                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <!-- SPARING Tile -->
                                    <div id="tileSPARING" class="tile disabled">
                                        <div class="flex items-start gap-3 p-4">
                                            <div class="rounded-xl p-2 bg-slate-100" id="iconSPARING">
                                                <!-- Icon: Waves -->
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-600">
                                                    <path d="M3 12c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
                                                    <path d="M3 18c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
                                                </svg>
                                            </div>
                                            <div class="flex-1">
                                                <div class="text-lg font-semibold tracking-tight">SPARING</div>
                                                <p class="mt-1 text-sm text-slate-500">Pelaporan limbah cair & kepatuhan lingkungan.</p>
                                            </div>
                                            <div>
                                                <button id="openSPARING" class="btn">Open
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="ml-1 inline">
                                                        <path d="M9 6l6 6-6 6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="pointer-events-none h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 opacity-75"></div>
                                    </div>

                                    <!-- AQMS Tile -->
                                    <div id="tileAQMS" class="tile disabled">
                                        <div class="flex items-start gap-3 p-4">
                                            <div class="rounded-xl p-2 bg-slate-100" id="iconAQMS">
                                                <!-- Icon: Wind -->
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-600">
                                                    <path d="M3 12h10a3 3 0 1 0-3-3" />
                                                    <path d="M3 18h14a 3 3 0 1 1-3 3" />
                                                </svg>
                                            </div>
                                            <div class="flex-1">
                                                <div class="text-lg font-semibold tracking-tight">AQMS</div>
                                                <p class="mt-1 text-sm text-slate-500">Monitoring kualitas udara ambien realtime.</p>
                                            </div>
                                            <div>
                                                <button id="openAQMS" class="btn">Open
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="ml-1 inline">
                                                        <path d="M9 6l6 6-6 6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="pointer-events-none h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 opacity-75"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Test results -->
                            <div class="mt-4 text-xs text-slate-500 hidden">
                                <div class="font-medium">Unit tests (grants):</div>
                                <div>Pass: <span id="passCount">0</span> | Fail: <span id="failCount">0</span></div>
                                <details id="failDetails" class="mt-1 hidden">
                                    <summary class="cursor-pointer">Show errors</summary>
                                    <pre id="failPayload" class="whitespace-pre-wrap text-[11px]"></pre>
                                </details>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>

        <!-- Footer -->
        <footer class="mt-auto border-t border-emerald-100/60 bg-white/30 backdrop-blur">
            <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 text-xs text-white md:flex-row">
                <div>© <span id="year"></span> Be Enviro. All rights reserved.</div>
                <div class="flex items-center gap-4" id="support">
                    <a class="hover:text-emerald-700" href="#">Kebijakan Privasi</a>
                    <a class="hover:text-emerald-700" href="#">Syarat & Ketentuan</a>
                    <a class="hover:text-emerald-700" href="#">Bantuan</a>
                </div>
            </div>
        </footer>
    </div>

    <!-- Vanilla JS: logic for particles, login, grants & tests -->
    <script>
        // helpers
        const $ = (sel) => document.querySelector(sel);
        function computeGrants(email, loggedIn) {
            if (!loggedIn) return { SPARING: false, AQMS: false };
            const e = (email || "").toLowerCase();
            if (e.includes("admin")) return { SPARING: true, AQMS: true };
            if (e.includes("spar")) return { SPARING: true, AQMS: false };
            if (e.includes("aqms")) return { SPARING: false, AQMS: true };
            return { SPARING: false, AQMS: true }; // default
        }
        function runGrantsTests() {
            const cases = [
                { name: "logged out → no access", email: "", loggedIn: false, expect: { SPARING: false, AQMS: false } },
                { name: "admin → both", email: "admin@example.com", loggedIn: true, expect: { SPARING: true, AQMS: true } },
                { name: "spar-only", email: "user@sparcorp.com", loggedIn: true, expect: { SPARING: true, AQMS: false } },
                { name: "aqms-only", email: "user@aqms.org", loggedIn: true, expect: { SPARING: false, AQMS: true } },
                { name: "default logged-in → AQMS only", email: "user@company.com", loggedIn: true, expect: { SPARING: false, AQMS: true } },
            ];
            let pass = 0; let fail = 0; const errors = [];
            console.group("EnviroLanding: grant-mapping tests");
            cases.forEach((c) => {
                const got = computeGrants(c.email, c.loggedIn);
                const ok = got.SPARING === c.expect.SPARING && got.AQMS === c.expect.AQMS;
                console[ok ? "log" : "error"](`${ok ? "✔" : "✖"} ${c.name}`, got);
                if (ok) pass++; else { fail++; errors.push({ case: c.name, got }); }
            });
            console.groupEnd();
            return { pass, fail, errors };
        }
        function setBadge(el, enabled, altColor) {
            el.className = "badge " + (enabled ? (altColor || "badge-solid") : "badge-outline text-slate-500 border-slate-300");
        }
        function setTileState(tileEl, enabled) {
            if (enabled) {
                tileEl.classList.remove("disabled");
            } else {
                tileEl.classList.add("disabled");
            }
        }

        // particles
        function initParticles() {
            const wrap = $("#particles");
            return Array.from({length: 14}).map((_, i) => {
                const size = 12 + Math.round(Math.random() * 26);
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const duration = 10 + Math.random() * 16;
                const delay = Math.random() * 4;
                const span = document.createElement("span");
                span.className = "particle";
                span.style.width = size + "px";
                span.style.height = size + "px";
                span.style.left = x + "%";
                span.style.top = y + "%";
                span.style.animationDuration = duration + "s";
                span.style.animationDelay = delay + "s";
                wrap.appendChild(span);
                return span;
            });
        }

        // main
        document.addEventListener("DOMContentLoaded", () => {
            $("#year").textContent = String(new Date().getFullYear());
            initParticles();

            // tests
            const t = runGrantsTests();
            $("#passCount").textContent = t.pass;
            $("#failCount").textContent = t.fail;
            if (t.fail > 0) {
                $("#failDetails").classList.remove("hidden");
                $("#failPayload").textContent = JSON.stringify(t.errors, null, 2);
            }

            const form = $("#loginForm");
            const submitBtn = $("#submitBtn");
            const access = $("#access");

            // form.addEventListener("submit", (e) => {
            //     e.preventDefault();
            //     submitBtn.disabled = true; submitBtn.textContent = "Memproses...";
            //     setTimeout(() => {
            //         // simulate logged-in
            //         const email = $("#email").value;
            //         const grants = computeGrants(email, true);
            //
            //         // badges
            //         setBadge($("#badgeSPARING"), grants.SPARING);
            //         setBadge($("#badgeAQMS"), grants.AQMS, grants.AQMS ? "bg-sky-600 text-white" : undefined);
            //
            //         // tiles state
            //         setTileState($("#tileSPARING"), grants.SPARING);
            //         setTileState($("#tileAQMS"), grants.AQMS);
            //
            //         access.classList.remove("hidden");
            //         access.classList.add("animate-fadeInUp");
            //
            //         submitBtn.disabled = false; submitBtn.textContent = "Masuk";
            //
            //         // actions
            //         $("#openSPARING").onclick = () => {
            //             if (!grants.SPARING) return;
            //             alert("Navigasi ke SPARING..."); // TODO: window.location.href = "/sparing/dashboard";
            //         };
            //         $("#openAQMS").onclick = () => {
            //             if (!grants.AQMS) return;
            //             alert("Navigasi ke AQMS..."); // TODO: window.location.href = "/aqms/overview";
            //         };
            //     }, 400);
            // });
        });
    </script>
</x-guest-layout>

@vite(['resources/js/login/index.tsx'])
