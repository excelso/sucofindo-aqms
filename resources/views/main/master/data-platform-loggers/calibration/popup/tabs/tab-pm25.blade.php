<div id="tabPM25">
    <div class="hidden p-5 rounded-lg" id="pm25">
        <!--region PM 2.5-->
        <div class="mb-7 formParamPm25">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter PM 2.5</div>
                    </div>
                </div>

                <div>
                    <button class="btn btn-primary">
                        <i class="fas fa-plus-circle mr-2"></i> Add Date
                    </button>
                </div>
            </div>
            <div class="pm25Body">

            </div>

            <div class="mt-10">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Calculate Calibration</div>
                        </div>
                    </div>

                    <div>
                        <button class="btn btn-primary calculateCalibrationPM25">
                            <i class="fas fa-calculator mr-2"></i> Calculate
                        </button>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 bg-gray-50 px-4 py-4 mb-2 rounded-md">
                <div class="form-group !mb-0">
                    <label>
                        <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                        Koefisien Kemiringan (m)
                    </label>
                    <label class="form-group-control">
                        <input class="form-control pm25Kemiringan number" disabled>
                    </label>
                </div>
                <div class="form-group !mb-0">
                    <label>
                        <div class="w-[7px] bg-gray-400 mr-2"></div>
                        Intercept (c)
                    </label>
                    <label class="form-group-control">
                        <input class="form-control pm25Intercept number" disabled>
                    </label>
                </div>
            </div>
        </div>
        <!--endregion-->
    </div>
</div>
