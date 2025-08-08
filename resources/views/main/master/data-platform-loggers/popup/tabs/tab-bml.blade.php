<div id="tabBml">
    <div class="hidden p-5 rounded-lg" id="bml">
        <!--region PM 2.5-->
        <div class="mb-7 formParamPm25">
            <div class="flex items-center mb-5">
                <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                <div class="">
                    <div class="text-[13px] font-bold">Parameter PM 2.5</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                            Low Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm25Min">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas bawah</div>
                        </div>
                        <ul class="pm25MinError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                            Low Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm25MinBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas bawah</div>
                        </div>
                        <ul class="pm25MinBufferError"></ul>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                            High Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm25MaxBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas atas</div>
                        </div>
                        <ul class="pm25MaxBufferError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                            High Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm25Max">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas atas</div>
                        </div>
                        <ul class="pm25MaxError"></ul>
                    </div>
                </div>
            </div>
        </div>
        <!--endregion-->

        <!--region PM 10-->
        <div class="mb-7 formParamPm10">
            <div class="flex items-center mb-5">
                <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                <div class="">
                    <div class="text-[13px] font-bold">Parameter PM 10</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                            Low Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm10Min">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas bawah</div>
                        </div>
                        <ul class="pm10MinError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                            Low Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm10MinBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas bawah</div>
                        </div>
                        <ul class="pm10MinBufferError"></ul>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                            High Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm10MaxBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas atas</div>
                        </div>
                        <ul class="pm10MaxBufferError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                            High Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number pm10Max">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas atas</div>
                        </div>
                        <ul class="pm10MaxError"></ul>
                    </div>
                </div>
            </div>
        </div>
        <!--endregion-->

        <!--region TSP-->
        <div class="mb-7 formParamTsp">
            <div class="flex items-center mb-5">
                <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                <div class="">
                    <div class="text-[13px] font-bold">Parameter TSP</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                            Low Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number tspMin">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas bawah</div>
                        </div>
                        <ul class="tspMinError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                            Low Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number tspMinBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas bawah</div>
                        </div>
                        <ul class="tspMinBufferError"></ul>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                            High Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number tspMaxBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas atas</div>
                        </div>
                        <ul class="tspMaxBufferError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                            High Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number tspMax">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas atas</div>
                        </div>
                        <ul class="tspMaxError"></ul>
                    </div>
                </div>
            </div>
        </div>
        <!--endregion-->

        <!--region Noise-->
        <div class="mb-7 formParamNoise">
            <div class="flex items-center mb-5">
                <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                <div class="">
                    <div class="text-[13px] font-bold">Parameter Noise</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                            Low Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number noiseMin">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas bawah</div>
                        </div>
                        <ul class="noiseMinError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                            Low Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number noiseMinBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas bawah</div>
                        </div>
                        <ul class="noiseMinBufferError"></ul>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-100 px-4 py-4 rounded-md">
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                            High Warn
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number noiseMaxBuffer">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai Buffer batas atas</div>
                        </div>
                        <ul class="noiseMaxBufferError"></ul>
                    </div>
                    <div class="form-group !mb-0">
                        <label>
                            <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                            High Mutu (KLHK)
                        </label>
                        <label class="form-group-control">
                            <input class="form-control number noiseMax">
                        </label>
                        <div class="info-alert-text !text-[12px]">
                            <div><i class="fas fa-info-circle mr-1"></i></div>
                            <div>Nilai BML batas atas</div>
                        </div>
                        <ul class="noiseMaxError"></ul>
                    </div>
                </div>
            </div>
        </div>
        <!--endregion-->
    </div>
</div>
