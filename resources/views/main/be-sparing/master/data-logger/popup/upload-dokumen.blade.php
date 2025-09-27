<div class="modal hidden modalUpload">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-cloud-upload mr-2"></i> Upload Dokumen
                </div>
                <div>
                    <div class="cursor-pointer closeModalUpload">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[400px]">
            <div class="form-group">
                <label>Nama Dokumen</label>
                <label class="form-group-control">
                    <input class="form-control namaDokumen" placeholder="..."/>
                </label>
                <ul class="namaDokumenError"></ul>
            </div>
            <div class="form-group">
                <label>File</label>
                <label class="form-group-control">
                    <input type="file" class="form-control-upload fileDokumen" placeholder="..."/>
                    <input type="hidden" class="fileDokumenName"/>
                    <input type="hidden" class="fileDokumenBase64"/>
                    <input type="hidden" class="fileDokumenMimeType"/>
                    <input type="hidden" class="fileDokumenSize"/>
                    <input type="hidden" class="fileDokumenUrl"/>
                </label>
                <ul class="fileDokumenError"></ul>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case btnSimpanUpload">
                    <i class="fas fa-save mr-2"></i> Simpan
                </button>
            </div>
        </div>
    </div>
</div>
