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
                <label>Interval</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom interval" name="interval">
                        <option value="">1 Jam</option>
                        <option value="1" {{ request()->input('interval') == '1' ? 'selected' : '' }}>1 Hari</option>
                        <option value="2" {{ request()->input('interval') == '2' ? 'selected' : '' }}>1 Bulan</option>
                    </select>
                </div>
            </div>
            <div class="formHarian form-group">
                <label>Tanggal</label>
                <label class="form-group-control">
                    <input type="hidden" class="tanggalCurr" value="{{ request()->input('tanggal') ?? \Carbon\Carbon::now()->format('Y-m-d') }}">
                    <input type="text" class="form-control tanggal datepicker" name="tanggal" value="{{ request()->input('tanggal') ?? \Carbon\Carbon::now()->format('Y-m-d') }}" placeholder="..."/>
                </label>
            </div>
            <div class="formTanggal grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tanggal Awal</label>
                        <div class="form-group-control">
                            <input type="hidden" class="minDateCurr" value="{{ request()->input('minDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' }}">
                            <input type="text" class="form-control minDate datetimepickerStart" name="minDate" value="{{ request()->input('minDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' }}" placeholder="..."/>
                            <div class="form-control-append btnStartDate">
                                <span class="form-control-append-icon">
                                    <i class="fas fa-calendar"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tanggal Akhir</label>
                        <div class="form-group-control">
                            <input type="hidden" class="maxDateCurr" value="{{ request()->input('maxDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}">
                            <input type="text" class="form-control maxDate datetimepickerUntil" name="maxDate" value="{{ request()->input('maxDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}" placeholder="..."/>
                            <div class="form-control-append btnUntilDate">
                                <span class="form-control-append-icon">
                                    <i class="fas fa-calendar"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="formBulanan grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Bulan</label>
                        <div class="form-group-control">
                            <select class="form-control select2-custom bulan" name="bulan">
                                <option value="">...</option>
                                @for($i = 1; $i <= 12; $i++)
                                    @php($selected = '')
                                    @if(request()->input('bulan'))
                                        @if(request()->input('bulan') == $i)
                                            @php($selected = 'selected')
                                        @endif
                                    @else
                                        @if(date('n') == $i)
                                            @php($selected = 'selected')
                                        @endif
                                    @endif

                                    <option value="{{ $i }}" {{ $selected }}>{{ \Carbon\Carbon::parse(date('Y') . '-' . $i . '-01')->translatedFormat('F') }}</option>
                                @endfor
                            </select>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="form-group">
                        <label>Tahun</label>
                        <div class="form-group-control">
                            <select class="form-control select2-custom tahun" name="tahun">
                                <option value="">...</option>
                                @for($i = 2021; $i <= date('Y'); $i++)
                                    @php($selected = '')
                                    @if(request()->input('tahun'))
                                        @if(request()->input('tahun') == $i)
                                            @php($selected = 'selected')
                                        @endif
                                    @else
                                        @if(date('Y') == $i)
                                            @php($selected = 'selected')
                                        @endif
                                    @endif
                                    <option value="{{ $i }}" {{ $selected }}>{{ $i }}</option>
                                @endfor
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Status Platform</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom" name="statusPlatform">
                        <option value="">Semua Status</option>
                        <option value="1" {{ request()->input('statusPlatform') == '1' ? 'selected' : '' }}>Normal</option>
                        <option value="2" {{ request()->input('statusPlatform') == '2' ? 'selected' : '' }}>Warning</option>
                        <option value="3" {{ request()->input('statusPlatform') == '3' ? 'selected' : '' }}>Danger</option>
                    </select>
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
