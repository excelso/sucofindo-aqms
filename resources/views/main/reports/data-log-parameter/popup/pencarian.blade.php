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
                <label>Logger Platform</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom platformUid" name="platformUid">
                        @foreach($dataAllPlatform as $item)
                            @php($selected = request()->input('platformUid') == $item->uid ? 'selected' : '')
                            <option value="{{ $item->uid }}" data-additional="{{ $item->sites->companies->company_name ?? '-' }} / {{ $item->sites->site_name ?? '-' }}" {{ $selected }}>{{ $item->uid_alias }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label>Start Date</label>
                    <div class="form-group-control">
                        <input type="text" class="form-control datetimepickerStart" name="startDate" value="{{ request()->input('startDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' }}" placeholder="..."/>
                        <div class="form-control-append btnStartDate">
                            <span class="form-control-append-icon">
                                <i class="fas fa-calendar"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Until Date</label>
                    <div class="form-group-control">
                        <input type="text" class="form-control datetimepickerUntil" name="untilDate" value="{{ request()->input('untilDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}" placeholder="..."/>
                        <div class="form-control-append btnUntilDate">
                            <span class="form-control-append-icon">
                                <i class="fas fa-calendar"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>AQI Category</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom" name="statusAqi">
                        <option value="">All Category</option>
                        <option value="good" {{ request()->input('statusAqi') == 'good' ? 'selected' : '' }}>
                            {{ mb_convert_encoding('&#x1F601;', 'UTF-8', 'HTML-ENTITIES') }} Good
                        </option>
                        <option value="mode" {{ request()->input('statusAqi') == 'mode' ? 'selected' : '' }}>
                            {{ mb_convert_encoding('&#x1F61E;', 'UTF-8', 'HTML-ENTITIES') }} Moderate
                        </option>
                        <option value="nogo" {{ request()->input('statusAqi') == 'nogo' ? 'selected' : '' }}>
                            {{ mb_convert_encoding('&#x1F922;', 'UTF-8', 'HTML-ENTITIES') }} Not Good
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a href="/reports/logs-parameter" class="ds-btn ds-btn-error btnResetPencarian">
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
