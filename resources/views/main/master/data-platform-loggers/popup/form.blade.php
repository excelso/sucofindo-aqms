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
                        <button class="inline-block p-4" data-tabs-target="#platform">
                            <i class="fas fa-microchip mr-2"></i> Data Platform
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#bml">
                            <i class="fas fa-chart-line mr-2"></i> BML
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#camera">
                            <i class="fas fa-camera mr-2"></i> Camera
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#maps">
                            <i class="fas fa-map-location mr-2"></i> Map Location
                        </button>
                    </li>
                </ul>
            </div>

            @include('main.master.data-platform-loggers.popup.tabs.tab-platform')
            @include('main.master.data-platform-loggers.popup.tabs.tab-bml')
            @include('main.master.data-platform-loggers.popup.tabs.tab-camera')
            @include('main.master.data-platform-loggers.popup.tabs.tab-maps')
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
