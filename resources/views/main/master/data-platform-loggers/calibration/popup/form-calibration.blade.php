<div class="modal hidden modalForm">
    <div class="modal-main !w-[calc(1440px-650px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-plus-circle mr-2"></i> {{ __('Platforms') }}
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !p-0 !max-h-[calc(100vh-17rem)]">
            <div class="flex justify-between items-center border-b border-gray-200 sticky top-0 z-[1] bg-white">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" data-tabs-toggle="#tabPlatform" data-role="exTabs">
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#pm25">
                            <i class="fas fa-microchip mr-2"></i> PM 2.5
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#pm10">
                            <i class="fas fa-microchip mr-2"></i> PM 10
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#tsp">
                            <i class="fas fa-microchip mr-2"></i> TSP
                        </button>
                    </li>
                </ul>
            </div>

            @include('main.master.data-platform-loggers.calibration.popup.tabs.tab-pm25')
            @include('main.master.data-platform-loggers.calibration.popup.tabs.tab-pm10')
            @include('main.master.data-platform-loggers.calibration.popup.tabs.tab-tsp')
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="btn btn-error text-white !hidden btnDelete">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button class="btn btn-primary btnSave">
                    <i class="fas fa-save mr-2"></i> Save
                </button>
            </div>
        </div>
    </div>
</div>
