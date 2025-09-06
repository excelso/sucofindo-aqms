<div class="modal hidden modalDetailParameter">
    <div class="modal-main !w-[calc(1440px-650px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-circle-plus mr-2"></i> CCTV
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-15rem)]">
            <div class="relative overflow-y-auto !min-h-[350px]">
                <div class="bodyChart !h-[350px]"></div>
                <div class="paramNotFound !hidden not-found h-[200px]">
                    <div class="paramNotFoundMessage">{{ __('Logger Report Empty!') }}</div>
                </div>
                <div class="paramLoader loader !absolute top-0 bottom-0 left-0 right-0">
                    <div class="flex items-center p-5 bg-gray-400/30 rounded-md">
                        <div><i class="fas fa-spinner fa-pulse mr-2"></i></div>
                        <div>{{ __('Please wait ...') }}</div>
                    </div>
                </div>
            </div>
            <div class="text-[13px]">
                <div class="font-bold">Keterangan:</div>
                <div class="regulationNote"></div>
                <div class="!hidden">BML parameter PM 10, PM 2.5 mengacu ke PP Nomor 22 Tahun 2021 Lampiran VII</div>
                <div class="!hidden">BML parameter kebisingan mengacu ke KEP-48/MENLH/11/1996 tentang Baku Tingkat Kebisingan</div>
            </div>
        </div>
    </div>
</div>
