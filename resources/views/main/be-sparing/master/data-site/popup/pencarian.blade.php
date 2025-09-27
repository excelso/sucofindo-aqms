<div class="modal hidden modalPencarian">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-search mr-2"></i> Pencarian
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[400px]">
            <div class="form-group">
                <label>Nama Perusahaan</label>
                <div class="form-group-control">
                    <select name="customer_id" class="form-select select2-custom srcCustomerId" disabled>
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
                    <select name="customer_lokasi_id" class="form-select select2-custom srcCustomerLokasiId" data-selected="{{ request()->input('customer_lokasi_id') }}">
                        <option value="">...</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Nama WMP</label>
                <label class="form-group-control">
                    <input name="nama_site" class="form-control" value="{{ request()->input('nama_site') ?? '' }}" placeholder="..."/>
                </label>
                <ul class="namaSiteError"></ul>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="ds-btn ds-btn-error btnResetPencarian">
                    <i class="fas fa-refresh"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case btnCari">
                    <i class="fas fa-search mr-2"></i> Cari
                </button>
            </div>
        </div>
    </div>
</div>
