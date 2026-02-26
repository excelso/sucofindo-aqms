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
                <label>Data Platform</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom platformUid" name="platformUid">
                        @foreach($dataPlatform as $item)
                            @php
                                $urlUid = request()->input('platformUid');
                                $urlTipeLogger = request()->input('tipeLogger');
                                $optionValue = $item->uid . '#' . $item->tipe_logger;
                                $urlValue = $urlUid . '#' . $urlTipeLogger;

                                $selected = ($optionValue == $urlValue) ? 'selected' : '';
                            @endphp
                            @if(request()->user()->user_level != 'viewer')
                                <option value="{{ $item->uid }}#{{ $item->tipe_logger }}" data-status="{{ $item->status_platform }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site }} / {{ $item->site->customerLokasi->nama_lokasi }} / {{ $item->tipe_logger == 1 ? 'Internal' : 'KLHK' }}" {{ $selected }}>{{ $item->uid }}</option>
                            @else
                                <option value="{{ $item->uid }}#{{ $item->tipe_logger }}" data-status="{{ $item->status_platform }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site }} / {{ $item->site->customerLokasi->nama_lokasi }}" {{ $selected }}>{{ $item->uid }}</option>
                            @endif
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Bulan</label>
                        <div class="form-group-control">
                            <x-data-bulan class="bulan" name="bulan" selected="{{ request()->input('bulan') }}"/>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tahun</label>
                        <div class="form-group-control">
                            <x-data-tahun class="tahun" name="tahun" selected="{{ request()->input('tahun') }}"/>
                        </div>
                    </div>
                </div>
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
