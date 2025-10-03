<div class="modal hidden modalDokumen">
    <div class="modal-main !w-[calc(1440px-350px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-file mr-2"></i> Dokumen
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !p-0 !min-h-[calc(100vh-27rem)] !max-h-[calc(100vh-17rem)]">
            <table class="table table-fixed">
                <thead>
                    <tr class="sticky-header">
                        <th class="text-center w-[50px]">No.</th>
                        <th class="text-left w-[150px]">Nama Dokumen</th>
                        <th class="text-left w-[200px]">Nama File</th>
                        <th class="text-left w-[100px]">Tipe File</th>
                        <th class="text-right w-[70px]">Ukuran File</th>
                        <th class="text-center w-[50px]">#</th>
                    </tr>
                </thead>
                <tbody class="tBodyDokumen">
                </tbody>
            </table>
            <div class="noDokumen absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9]">
                <i class="fas fa-exclamation-circle mr-2"></i> Tidak ada Dokumen ditemukan!
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button class="btn btn-primary closeModalForm">
                    <i class="fas fa-close mr-2"></i> Tutup
                </button>
            </div>
        </div>
    </div>
</div>
