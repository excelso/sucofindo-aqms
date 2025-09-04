<div class="modal hidden modalPlatformReport">
    <div class="modal-main !w-[calc(1440px-300px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-file mr-2"></i> Logger Report
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body relative !max-h-[calc(100vh-15rem)] !min-h-[calc(100vh-15rem)] !p-0">
            <div class="grid grid-cols-3 gap-4 p-6">
                <div class="bg-gray-200 rounded-md p-4">
                    <div>
                        <div class="flex items-center justify-between">
                            <div class="text-[14px] font-bold">{{ mb_convert_encoding('&#x1F601;', 'UTF-8', 'HTML-ENTITIES') }} Good</div>
                            <div class="goodStatus text-[14px] font-bold">0%</div>
                        </div>
                        <div class="text-[12px] ml-[25px]">BML : <span class="goodLimit">0 µg/m³</span></div>
                    </div>
                </div>
                <div class="bg-gray-200 rounded-md p-4">
                    <div>
                        <div class="flex items-center justify-between">
                            <div class="text-[14px] font-bold">{{ mb_convert_encoding('&#x1F61E;', 'UTF-8', 'HTML-ENTITIES') }} Moderate</div>
                            <div class="modeStatus text-[14px] font-bold">0%</div>
                        </div>
                        <div class="text-[12px] ml-[25px]">BML : <span class="modeLimit">0 µg/m³ - 0 µg/m³</span></div>
                    </div>
                </div>
                <div class="bg-gray-200 rounded-md p-4">
                    <div>
                        <div class="flex items-center justify-between">
                            <div class="text-[14px] font-bold">{{ mb_convert_encoding('&#x1F922;', 'UTF-8', 'HTML-ENTITIES') }} Not Good</div>
                            <div class="nogoStatus text-[14px] font-bold">0%</div>
                        </div>
                        <div class="text-[12px] ml-[25px]">BML : <span class="nogoLimit">0 µg/m³</span></div>
                    </div>
                </div>
            </div>
            <div class="relative overflow-y-auto !max-h-[calc(100vh-21.5rem)] !min-h-[calc(100vh-21.5rem)]">
                <table class="table table-fixed">
                    <thead>
                        <tr class="sticky-header">
                            <th class="text-center w-[70px]">No.</th>
                            <th class="text-center w-[130px]">UID</th>
                            <th class="text-center w-[180px]">Date & Time</th>
                            <th class="text-right w-[120px]">PM 2.5</th>
                            <th class="text-right w-[120px]">PM 10</th>
                            <th class="text-right w-[120px]">TSP</th>
                            <th class="text-right w-[120px]">Noise</th>
                            <th class="text-center w-[150px]">
                                AQI Index<br>
                                <span class="text-gray-300 text-[12px]">(PM 2.5 / PM 10)</span>
                            </th>
                            <th class="text-center w-[150px]">
                                AQI Index<br>
                                <span class="text-gray-300 text-[12px]">(TSP)</span>
                            </th>
                            <th class="text-left w-[180px]">AQI Category</th>
                        </tr>
                    </thead>
                    <tbody class="tReportData"></tbody>
                </table>

                <div class="reportNotFound !hidden not-found h-[200px]">
                    <div class="reportNotFoundMessage">{{ __('Logger Report Empty!') }}</div>
                </div>
                <div class="reportLoader loader !absolute top-0 bottom-0 left-0 right-0 h-[calc(100vh-15rem)]">
                    <div class="flex items-center p-5 bg-gray-400/30 rounded-md">
                        <div><i class="fas fa-spinner fa-pulse mr-2"></i></div>
                        <div>{{ __('Please wait ...') }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer footerReport">
            <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[10px] py-[5px] w-full">
                <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div class="mr-2">
                        <p class="text-sm text-gray-700 leading-5">
                            {!! __('Showing') !!}
                            <span class="font-medium pagiLabelFrom"></span>
                            {!! __('to') !!}
                            <span class="font-medium pagiLabelTo"></span>
                            {!! __('from') !!}
                            <span class="font-medium pagiLabelTotal"></span>
                            {!! __('Data') !!}
                        </p>
                    </div>
                    <div>
                        <div class="relative z-0 inline-flex shadow-sm rounded-md">
                            <div class="pagiPrevLink inline-flex"></div>
                            {{-- LoopLink --}}
                            <div class="pagiLoopLink inline-flex"></div>
                            {{-- END LoopLink --}}
                            <div class="pagiNextLink inline-flex"></div>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    </div>
</div>
