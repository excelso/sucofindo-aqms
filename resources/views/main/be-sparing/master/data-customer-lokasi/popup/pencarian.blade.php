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
                    <select name="customer_id" class="form-select select2-custom">
                        <option value="">...</option>
                        @if(isset($customer))
                            @foreach($customer as $item)
                                @php($selected = $item->id == request()->input('customer_id') ? 'selected' : '')
                                <option value="{{ $item->id }}" {{ $selected }}>{{ $item->nama_perusahaan }}</option>
                            @endforeach
                        @endif
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Nama Site / Lokasi</label>
                <label class="form-group-control">
                    <input name="nama_lokasi" class="form-control" value="{{ request()->input('nama_lokasi') ?? '' }}" placeholder="..."/>
                </label>
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
