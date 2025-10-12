<div id="tabCamera">
    <div class="hidden p-5 rounded-lg" id="camera">
        <div class="grid grid-cols-2 gap-4">
            <div class="col-span-1">
                <div class="form-group">
                    <label>Camera URL 1 (RTC)</label>
                    <div class="form-group-control">
                        <input type="text" class="form-control cctvLink1" placeholder="...">
                        <div class="form-control-append">
                            <div class="form-control-append-icon">
                                <a class="cursor-pointer btnCheckLink1">
                                    <i class="fas fa-external-link"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <ul class="cctvLink1Error"></ul>
                </div>

                <div class="form-group">
                    <label class="inline-flex cursor-pointer">
                        <input type="checkbox" class="sr-only peer cctv1IsSupportPTZ">
                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <div class="ms-3 mt-[2px] text-sm text-gray-900">
                            <span class="!font-bold">{{ trans('PTZ Support?') }}</span>
                            <p class="text-gray-400 !font-normal">Is Camera 1 Support PTZ?</p>
                        </div>
                    </label>
                </div>
            </div>

            <div class="col-span-1">
                <div class="form-group">
                    <label>Camera URL 2 (RTC)</label>
                    <div class="form-group-control">
                        <input type="text" class="form-control cctvLink2" placeholder="...">
                        <div class="form-control-append">
                            <div class="form-control-append-icon">
                                <a class="cursor-pointer btnCheckLink2">
                                    <i class="fas fa-external-link"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <ul class="cctvLink2Error"></ul>
                </div>

                <div class="form-group">
                    <label class="inline-flex cursor-pointer">
                        <input type="checkbox" class="sr-only peer cctv2IsSupportPTZ">
                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <div class="ms-3 mt-[2px] text-sm text-gray-900">
                            <span class="!font-bold">{{ trans('PTZ Support?') }}</span>
                            <p class="text-gray-400 !font-normal">Is Camera 2 Support PTZ?</p>
                        </div>
                    </label>
                </div>
            </div>
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
