<div id="tabCamera">
    <div class="hidden p-5 rounded-lg" id="camera">
        <div class="form-group">
            <label>CCTV Link (RTC)</label>
            <div class="form-group-control">
                <input type="text" class="form-control cctvLink" placeholder="...">
                <div class="form-control-append">
                    <div class="form-control-append-icon">
                        <a class="cursor-pointer btnCheckLink">
                            <i class="fas fa-external-link"></i>
                        </a>
                    </div>
                </div>
            </div>
            <ul class="cctvLinkError"></ul>
        </div>

        <div class="form-group">
            <label>CCTV Link (HLS)</label>
            <div class="form-group-control">
                <input type="text" class="form-control cctvLinkHls" placeholder="...">
                <div class="form-control-append">
                    <div class="form-control-append-icon">
                        <a class="cursor-pointer btnCheckLinkHls">
                            <i class="fas fa-external-link"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="info-alert-text !text-[12px]">
                <div><i class="fas fa-info-circle mr-1"></i></div>
                <div>Format Link ini harus berformat HLS dan memiliki <b>index.m3u8</b></div>
            </div>
            <div class="info-alert-text !text-[12px]">
                <div><i class="fas fa-info-circle mr-1"></i></div>
                <div>Ex. https://cctv.com/hls/..<b>/index.m3u8</b></div>
            </div>
            <div class="info-alert-text !text-[12px]">
                <div><i class="fas fa-info-circle mr-1"></i></div>
                <div>Link CCTV ini digunakan untuk Recording Video</div>
            </div>
            <ul class="cctvLinkHlsError"></ul>
        </div>

        <div class="form-group">
            <label>CCTV Portal IP</label>
            <div class="form-group-control">
                <input type="text" class="form-control cctvPortalIP" placeholder="...">
            </div>
            <div class="info-alert-text !text-[12px]">
                <div><i class="fas fa-info-circle mr-1"></i></div>
                <div>Format IP Tanpa HTTP / HTTPS</div>
            </div>
            <ul class="cctvPortalIPError"></ul>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
                <label>CCTV Portal Username</label>
                <div class="form-group-control">
                    <input type="text" class="form-control cctvPortalUsername" placeholder="...">
                </div>
                <ul class="cctvPortalUsernameError"></ul>
            </div>
            <div class="form-group">
                <label>CCTV Portal Password</label>
                <div class="form-group-control">
                    <input type="password" class="form-control cctvPortalPassword" placeholder="...">
                    <div class="form-control-append">
                        <div class="form-control-append-icon">
                            <a class="cursor-pointer btnShowPortalPassword">
                                <i class="fas fa-eye-slash"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <ul class="cctvPortalPasswordError"></ul>
            </div>
        </div>
    </div>
</div>
