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
                        @foreach($dataAllPlatform as $item)
                            @php($selected = request()->input('platformUid') == $item->uid ? 'selected' : '')
                            <option value="{{ $item->uid }}" data-additional="{{ $item->sites->companies->company_name }} / {{ $item->sites->site_name }}" {{ $selected }}>{{ $item->uid }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Date Range</label>
                <label class="form-group-control">
                    <input type="text" class="form-control dateRange datePickerRange" name="dateRange" value="{{ request()->input('dateRange') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' . ' - ' . \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}" placeholder="..."/>
                </label>
            </div>
            <div class="form-group">
                <label>Status Platform</label>
                <label class="form-group-control">
                    <select class="form-control select2-custom" name="statusPlatform">
                        <option value="">Semua Status</option>
                        <option value="1" {{ request()->input('statusPlatform') == '1' ? 'selected' : '' }}>Normal</option>
                        <option value="2" {{ request()->input('statusPlatform') == '2' ? 'selected' : '' }}>Warning</option>
                        <option value="3" {{ request()->input('statusPlatform') == '3' ? 'selected' : '' }}>Danger</option>
                    </select>
                </label>
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
