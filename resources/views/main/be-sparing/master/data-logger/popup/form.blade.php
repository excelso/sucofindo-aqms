<div class="modal hidden modalForm">
    <div class="modal-main !w-[calc(1440px-350px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-plus-circle"></i> Tambah Logger
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
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" data-tabs-toggle="#tabLogger" data-role="exTabs">
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#setting">
                            <i class="fas fa-wrench mr-2"></i> Pengaturan Logger
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#re-engineering">
                            <i class="fas fa-file mr-2"></i> Re Engineer
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#dokumen">
                            <i class="fas fa-file mr-2"></i> Dokumen
                        </button>
                    </li>
                </ul>
                <div class="px-4">
                    <a class="btnTambahDokumen hidden cursor-pointer font-bold text-[13px]">
                        <i class="fas fa-plus-circle mr-1"></i> Tambah Dokumen
                    </a>
                </div>
            </div>

            <div id="tabLogger">
                @include('main.be-sparing.master.data-logger.popup.tabs.logger')
                @include('main.be-sparing.master.data-logger.popup.tabs.re-engineer')
                @include('main.be-sparing.master.data-logger.popup.tabs.dokumen')
            </div>

        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="btn btn-error text-white hidden btnHapus">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
            <div class="ml-auto">
                {{-- <button class="btn btnMonitor mr-2"> --}}
                {{--     <i class="fas fa-desktop mr-2"></i> Monitor --}}
                {{-- </button> --}}
                <button class="btn btn-primary btnSimpan">
                    <i class="fas fa-save mr-2"></i> Simpan
                </button>
            </div>
        </div>
    </div>
</div>
