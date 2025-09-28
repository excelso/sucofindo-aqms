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
                            @php($selected = request()->input('platformUid') == $item->uid && request()->input('tipeLogger') == $item->tipe_logger ? 'selected' : '')
                            @if(Auth::user()->user_level != 'viewer')
                                <option value="{{ $item->uid }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site ?? '' }} / {{ $item->site->customerLokasi->nama_lokasi ?? '' }} / {{ $item->tipe_logger == 1 ? 'Internal' : 'KLHK' }}" {{ $selected }}>{{ $item->uid }}</option>
                            @else
                                <option value="{{ $item->uid }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site ?? '' }} / {{ $item->site->customerLokasi->nama_lokasi ?? '' }}" {{ $selected }}>{{ $item->uid }}</option>
                            @endif
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Data Sensor</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom parameterId" name="parameterId" data-selected="{{ request()->input('parameterId') ?? 'pH' }}">
                        <option value="">...</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tanggal Awal</label>
                        <label class="form-group-control">
                            <input type="text" class="form-control datetimepickerStart" name="minDate" value="{{ request()->input('minDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' }}" placeholder="..."/>
                        </label>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tanggal Akhir</label>
                        <label class="form-group-control">
                            <input type="text" class="form-control datetimepickerUntil" name="maxDate" value="{{ request()->input('maxDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}" placeholder="..."/>
                        </label>
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
