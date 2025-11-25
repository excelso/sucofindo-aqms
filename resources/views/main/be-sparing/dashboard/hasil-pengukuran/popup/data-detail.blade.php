<div class="modal hidden modalDetail">
    <div class="modal-main !w-[calc(1440px-35%)] !2xl:w-[calc(1440px-35%)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-file-lines mr-2"></i> Detail
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body !p-0">
            <div class="flex justify-between items-center border-b border-gray-200 sticky top-0 z-[1] bg-white">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" data-tabs-toggle="#tabLogger" data-role="exTabs">
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#summary">
                            <i class="fas fa-file mr-2"></i> Data Summary
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#lost">
                            <i class="fas fa-file mr-2"></i> Data Lost
                        </button>
                    </li>
                </ul>
            </div>

            <div id="tabLogger">
                <div class="hidden rounded-lg overflow-y-auto min-h-[300px] !max-h-[calc(100vh-15rem)]" id="summary">
                    <table class="table table-fixed">
                        <thead>
                            <tr>
                                <th class="text-center w-[150px]">{{ __('Tanggal') }}</th>
                                <th class="text-right w-[150px]">
                                    <div>{{ __('pH') }}</div>
                                    <div class="text-gray-400 !text-[12px] phBmal">-</div>
                                </th>
                                <th class="text-right w-[150px]">
                                    <div>{{ __('TSS (mg/L)') }}</div>
                                    <div class="text-gray-400 !text-[12px] tssBmal">-</div>
                                </th>
                                <th class="text-right w-[150px]">
                                    <div>{{ __('Debit') }} (m<sup>3</sup>/day)</div>
                                    <div class="text-gray-400 !text-[12px] debitBmal">-</div>
                                </th>
                                <th class="text-right w-[150px]">{{ __('Total Masuk') }}</th>
                                <th class="text-right w-[150px]">{{ __('Persentase Lost') }}</th>
                            </tr>
                        </thead>
                        <tbody class="bodyDetail"></tbody>
                    </table>
                    <div class="bodyDetailLoader absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                        <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                    </div>
                    <div class="not-found bodyDetailLoaderNotFound hidden">
                        <div class="bodyDetailLoaderNotFoundMessage">{{ __('Data WMP Not Found!') }}</div>
                    </div>
                </div>

                <div class="hidden rounded-lg overflow-y-auto min-h-[300px] !max-h-[calc(100vh-15rem)]" id="lost">
                    <table class="table table-fixed">
                        <thead>
                            <tr>
                                <th class="text-center w-[200px]">{{ __('Tanggal') }}</th>
                                <th class="text-right w-[150px]">{{ __('pH') }}</th>
                                <th class="text-right w-[150px]">{{ __('TSS') }}</th>
                                <th class="text-right w-[150px]">{{ __('Debit') }}</th>
                            </tr>
                        </thead>
                        <tbody class="bodyLost"></tbody>
                    </table>
                    <div class="bodyLostLoader absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                        <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                    </div>
                    <div class="not-found bodyLostLoaderNotFound hidden">
                        <div class="bodyLostLoaderNotFoundMessage">{{ __('Data WMP Not Found!') }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case closeModalForm">
                    <i class="fas fa-close mr-2"></i> Close
                </button>
            </div>
        </div>
    </div>
</div>
