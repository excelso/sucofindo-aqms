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
                    <select name="customer_id" class="form-select select2-custom lookCustomerId" data-selected="{{ request()->input('customer_id') }}" disabled>
                        <option value="">...</option>
                        @if(isset($customer))
                            @if($customer->count() == 1)
                                <option value="{{ $customer[0]->id }}" selected>{{ $customer[0]->nama_perusahaan }}</option>
                            @else
                                @foreach($customer as $item)
                                    @php($selected = $item->id == request()->input('customer_id') ? 'selected' : '')
                                    <option value="{{ $item->id }}">{{ $item->nama_perusahaan }}</option>
                                @endforeach
                            @endif
                        @endif
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Nama Site / Lokasi</label>
                <div class="form-group-control">
                    <input type="hidden" class="lookCustomerLokasiIdTemp" value="{{ request()->input('customer_lokasi_id') }}">
                    <select name="customer_lokasi_id" class="form-select select2-custom lookCustomerLokasiId">
                        <option value="">...</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label>Bulan</label>
                    <div class="form-group-control">
                        <x-data-bulan selected="{{ request()->input('bulan') }}"/>
                    </div>
                </div>
                <div class="form-group">
                    <label>Tahun</label>
                    <div class="form-group-control">
                        <x-data-tahun selected="{{ request()->input('tahun') }}"/>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Status Online/Offline</label>
                <div class="form-group-control">
                    <select name="status_platform" class="form-select select2-custom">
                        <option value="">...</option>
                        <option value="online" {{ request()->input('status_platform') == 'online' ? 'selected' : '' }}>Online</option>
                        <option value="offline" {{ request()->input('status_platform') == 'offline' ? 'selected' : '' }}>Offline</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a href="/dashboard/hasil-pengukuran" class="ds-btn ds-btn-error btnResetPencarian">
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
