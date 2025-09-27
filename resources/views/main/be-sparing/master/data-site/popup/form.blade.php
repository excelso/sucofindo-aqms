<div class="modal hidden modalForm">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-plus-circle"></i> Tambah Customer
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-17rem)]">
            <div class="form-group">
                <label>Nama Perusahaan</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom customerId" disabled>
                        <option value="">...</option>
                        @if(isset($customer))
                            @if($customer->count() == 1)
                                <option value="{{ $customer[0]->id }}" selected>{{ $customer[0]->nama_perusahaan }}</option>
                            @else
                                @foreach($customer as $item)
                                    <option value="{{ $item->id }}">{{ $item->nama_perusahaan }}</option>
                                @endforeach
                            @endif
                        @endif
                    </select>
                </div>
                <ul class="customerIdError"></ul>
            </div>
            <div class="form-group">
                <label>Nama Site / Lokasi</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom customerLokasiId">
                        <option value="">...</option>
                    </select>
                </div>
                <ul class="customerLokasiIdError"></ul>
            </div>
            <div class="form-group">
                <label>Nama WMP</label>
                <label class="form-group-control">
                    <input type="hidden" class="siteId"/>
                    <input type="text" class="form-control namaSite" placeholder="..."/>
                </label>
                <ul class="namaSiteError"></ul>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="btn btn-error text-white hidden btnHapus">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button class="btn btn-primary btnSimpan">
                    <i class="fas fa-save mr-2"></i> Simpan
                </button>
            </div>
        </div>
    </div>
</div>
