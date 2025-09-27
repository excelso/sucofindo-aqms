<div class="hidden p-5 rounded-lg" id="re-engineering">

    <div class="flex items-center justify-between mb-10">
        <div class="flex items-center">
            <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
            <div>
                <div class="text-[17px] font-bold">Konfigurasi Re Engineer</div>
                <div class="text-[12px] text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i> Pengaturan nilai Floating Re Engineer pada sensor Platform/Logger
                </div>
            </div>
        </div>
        <div>
            <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer isTipeMonitor">
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span class="ml-2 text-[13px] font-bold">Monitoring Re Engineer</span>
            </label>
        </div>
    </div>

    <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">

        <div class="formReParamPh">
            <h2 id="accordion-flush-heading-1">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Parameter pH</div>
                        </div>
                    </div>
                    <div>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </div>
                </button>
            </h2>
            <div id="accordion-flush-body-1" class="hidden" aria-labelledby="accordion-flush-heading-1">

                <div class="py-5 border-b border-gray-200">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group !mb-0">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    pH Sensor Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control phReSensorMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="phReSensorMinError"></ul>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group !mb-0">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control phReMutuMin number">
                                    </label>
                                    <ul class="phReMutuMinError"></ul>
                                </div>
                                <div class="form-group !mb-0">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control phReWarnMin number">
                                    </label>
                                    <ul class="phReWarnMinError"></ul>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    pH Sensor Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control phReSensorMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="phReSensorMaxError"></ul>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control phReWarnMax number">
                                    </label>
                                    <div class="info-alert-text !hidden !text-[12px]">
                                        <div><i class="fas fa-info-circle mr-1"></i></div>
                                        <div>Nilai Floating Nearmiss batas atas</div>
                                    </div>
                                    <ul class="phReWarnMaxError"></ul>
                                </div>
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control phReMutuMax number">
                                    </label>
                                    <div class="info-alert-text !hidden !text-[12px]">
                                        <div><i class="fas fa-info-circle mr-1"></i></div>
                                        <div>Nilai Floating BML batas atas</div>
                                    </div>
                                    <ul class="phReMutuMaxError"></ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="formReParamCod">
            <h2 id="accordion-flush-heading-2">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-2" aria-expanded="true" aria-controls="accordion-flush-body-2">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Parameter COD</div>
                        </div>
                    </div>
                    <div>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </div>
                </button>
            </h2>
            <div id="accordion-flush-body-2" class="hidden" aria-labelledby="accordion-flush-heading-2">
                <div class="py-5 border-b border-gray-200">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="form-group">
                            <div class="form-label">
                                <div class="w-[7px] bg-gray-300 mr-2"></div>
                                COD Sensor Min
                            </div>
                            <label class="form-group-control">
                                <input class="form-control codReSensorMin number">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai rules KLHK Min</div>
                            </div>
                            <ul class="codReSensorMinError"></ul>
                        </div>
                        <div class="form-group">
                            <div class="form-label">
                                <div class="w-[7px] bg-gray-300 mr-2"></div>
                                COD Sensor Max
                            </div>
                            <label class="form-group-control">
                                <input class="form-control codReSensorMax number">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai rules KLHK Max</div>
                            </div>
                            <ul class="codReSensorMaxError"></ul>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid grid-rows-2 gap-4">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                    Low Range Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control codReMutuMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating BML batas bawah</div>
                                </div>
                                <ul class="codReMutuMinError"></ul>
                            </div>
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                    Low Range Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control codReWarnMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating Nearmiss batas bawah</div>
                                </div>
                                <ul class="codReWarnMinError"></ul>
                            </div>
                        </div>
                        <div class="grid grid-rows-2 gap-4">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                    High Range Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control codReMutuMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating BML batas atas</div>
                                </div>
                                <ul class="codReMutuMaxError"></ul>
                            </div>
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                    High Range Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control codReWarnMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating Nearmiss batas atas</div>
                                </div>
                                <ul class="codReWarnMaxError"></ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="formReParamTss">
            <h2 id="accordion-flush-heading-3">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-3" aria-expanded="true" aria-controls="accordion-flush-body-3">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Parameter TSS</div>
                        </div>
                    </div>
                    <div>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </div>
                </button>
            </h2>
            <div id="accordion-flush-body-3" class="hidden" aria-labelledby="accordion-flush-heading-3">
                <div class="py-5 border-b border-gray-200">
                    <div class="grid grid-cols-2 gap-4">

                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    TSS Sensor Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control tssReSensorMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="tssReSensorMinError"></ul>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control tssReMutuMin number">
                                    </label>
                                    <ul class="tssReMutuMinError"></ul>
                                </div>
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control tssReWarnMin number">
                                    </label>
                                    <ul class="tssReWarnMinError"></ul>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    TSS Sensor Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control tssReSensorMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="tssReSensorMaxError"></ul>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control tssReWarnMax number">
                                    </label>
                                    <ul class="tssReWarnMaxError"></ul>
                                </div>
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control tssReMutuMax number">
                                    </label>
                                    <ul class="tssReMutuMaxError"></ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="formReParamNh3n">
            <h2 id="accordion-flush-heading-4">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-4" aria-expanded="true" aria-controls="accordion-flush-body-4">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Parameter NH3n</div>
                        </div>
                    </div>
                    <div>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </div>
                </button>
            </h2>
            <div id="accordion-flush-body-4" class="hidden" aria-labelledby="accordion-flush-heading-4">
                <div class="py-5 border-b border-gray-200">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="form-group">
                            <div class="form-label">
                                <div class="w-[7px] bg-gray-300 mr-2"></div>
                                NH3n Sensor Min
                            </div>
                            <label class="form-group-control">
                                <input class="form-control nh3nReSensorMin number">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai rules KLHK Min/Max</div>
                            </div>
                            <ul class="nh3nReSensorMinError"></ul>
                        </div>
                        <div class="form-group">
                            <div class="form-label">
                                <div class="w-[7px] bg-gray-300 mr-2"></div>
                                NH3n Sensor Max
                            </div>
                            <label class="form-group-control">
                                <input class="form-control nh3nReSensorMax number">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai rules KLHK Min/Max</div>
                            </div>
                            <ul class="nh3nReSensorMaxError"></ul>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid grid-rows-2 gap-4">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                    Low Range Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control nh3nReMutuMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating BML batas bawah</div>
                                </div>
                                <ul class="nh3nReMutuMinError"></ul>
                            </div>
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                    Low Range Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control nh3nReWarnMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating Nearmiss batas bawah</div>
                                </div>
                                <ul class="nh3nReWarnMinError"></ul>
                            </div>
                        </div>
                        <div class="grid grid-rows-2 gap-4">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                    High Range Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control nh3nReMutuMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating BML batas atas</div>
                                </div>
                                <ul class="nh3nReMutuMaxError"></ul>
                            </div>
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                    High Range Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control nh3nReWarnMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Floating Nearmiss batas atas</div>
                                </div>
                                <ul class="nh3nReWarnMaxError"></ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="formReParamDebit">
            <h2 id="accordion-flush-heading-5">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-5" aria-expanded="true" aria-controls="accordion-flush-body-5">
                    <div class="flex items-center">
                        <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="">
                            <div class="text-[13px] font-bold">Parameter Debit</div>
                        </div>
                    </div>
                    <div>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </div>
                </button>
            </h2>
            <div id="accordion-flush-body-5" class="hidden" aria-labelledby="accordion-flush-heading-5">
                <div class="py-5 border-b border-gray-200">

                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    Debit Sensor Min
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control debitReSensorMin number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="debitReSensorMinError"></ul>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control debitReMutuMin number">
                                    </label>
                                    <ul class="debitReMutuMinError"></ul>
                                </div>
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control debitReWarnMin number">
                                    </label>
                                    <ul class="debiRetWarnMinError"></ul>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-rows-2 gap-4 bg-gray-100 px-5 pt-7 rounded-md">
                            <div class="form-group">
                                <div class="form-label">
                                    <div class="w-[7px] bg-gray-300 mr-2"></div>
                                    Debit Sensor Max
                                </div>
                                <label class="form-group-control">
                                    <input class="form-control debitReSensorMax number">
                                </label>
                                <div class="info-alert-text !text-[12px]">
                                    <div><i class="fas fa-info-circle mr-1"></i></div>
                                    <div>Nilai Triggered RE</div>
                                </div>
                                <ul class="debitReSensorMaxError"></ul>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                        Floating Range Min
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control debitReWarnMax number">
                                    </label>
                                    <ul class="debitReWarnMaxError"></ul>
                                </div>
                                <div class="form-group">
                                    <div class="form-label">
                                        <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                        Floating Range Max
                                    </div>
                                    <label class="form-group-control">
                                        <input class="form-control debitReMutuMax number">
                                    </label>
                                    <ul class="debitReMutuMaxError"></ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
