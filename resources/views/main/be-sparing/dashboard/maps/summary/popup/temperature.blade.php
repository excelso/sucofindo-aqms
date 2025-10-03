<div class="modal hidden modalTemperature">
    <div class="modal-main !w-[calc(1440px-650px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-temperature-half mr-2"></i> Data Temperature
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-12rem)]">
            <div>
                <div class="bodyTempChart !h-[425px]"></div>
            </div>
            <div class="mt-10">
                <div class="flex items-center mb-5">
                    <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="text-[17px] font-bold">Data Temperature</div>
                </div>
                <div class="mb-5">
                    <table class="table table-fixed">
                        <thead class="border-top">
                            <tr>
                                <th class="text-center w-[100px] !border-l-[1px]">Time</th>
                                <th class="text-right w-[120px]">Temp °C</th>
                                <th class="text-center w-[130px] !border-r-[1px]">Status</th>
                            </tr>
                        </thead>
                        <tbody class="bodyTempTable"></tbody>
                    </table>
                </div>
                <div class="footerDataTempTable !p-0 h-[65px]">
                    <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[15px]">
                        <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div class="mr-2 sm:hidden">
                                <p class="text-sm text-gray-700 leading-5">
                                    <span class="font-medium pagiLabelFrom hidden"></span>
                                    <span class="font-medium pagiLabelTo hidden"></span>
                                    {!! __('Total') !!}
                                    <span class="font-medium pagiLabelTotal"></span>
                                    {!! __('Data') !!}
                                </p>
                            </div>
                            <div class="ml-auto">
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
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case closeModalForm">
                    <i class="fas fa-close mr-2"></i> Tutup
                </button>
            </div>
        </div>
    </div>
</div>
