<div class="modal hidden modalHeartbeat">
    <div class="modal-main !w-[calc(1440px-700px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-circle-plus mr-2"></i> Logger Status
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-15rem)] !p-0">
            <div class="p-6 flex items-center gap-4">
                <div>
                    <div class="font-bold text-[14px]">Total Online</div>
                    <div class="text-[13px]">90%</div>
                </div>
                <div class="border-l-[2px] border-r-gray-100 pl-4">
                    <div class="font-bold text-[14px]">Total Offline</div>
                    <div class="text-[13px]">10%</div>
                </div>
            </div>
            <table class="table table-fixed">
                <thead>
                    <tr class="sticky-header">
                        <th class="text-center w-[150px]">UID</th>
                        <th class="text-left w-[150px]">Logger Status</th>
                        <th class="text-center w-[130px]">Update Date</th>
                        <th class="text-right w-[130px]">Duration</th>
                    </tr>
                </thead>
                <tbody class="tHeartbeatData"></tbody>
            </table>
        </div>
        <div class="modal-footer footerHeartbeat">
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
