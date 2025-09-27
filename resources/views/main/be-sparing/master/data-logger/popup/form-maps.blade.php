<div class="modal hidden modalFormMaps">
    <div class="modal-main !w-[calc(1440px-440px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-location-dot mr-2"></i> Maps
                </div>
                <div>
                    <div class="cursor-pointer closeModalFormMaps">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body relative !p-0">
            <div class="absolute z-[1] top-[10px] left-[10px]">
                <label class="form-group-control">
                    <input type="text" class="form-control cariAlamatMaps w-[350px]"/>
                    <input type="hidden" class="alamatLat">
                    <input type="hidden" class="alamatLng">
                    <input type="hidden" class="alamatFormatted">
                </label>
            </div>
            <img class="absolute z-[1] markerImage" src="{{ asset('images/maps/red-marker-512.png') }}" alt="" width="32">
            <div class="h-[calc(100vh-17rem)]" id="mapsBody"></div>
        </div>
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button class="ds-btn ds-btn-primary normal-case btnSimpanMaps">
                    <i class="fas fa-save mr-2"></i> Simpan
                </button>
            </div>
        </div>
    </div>
</div>
