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
                <label>Week</label>
                <div class="form-group-control">
                    <select class="form-control select2-custom" name="date">
                        @foreach($weeks as $week)
                            @php($selected = $week['isSelected'])
                            @if($week['startDate'] . '_' . $week['untilDate'] == request()->input('date'))
                                @php($selected = 'selected')
                            @endif
                            <option value="{{ $week['startDate'] }}_{{ $week['untilDate'] }}" data-additional="{{ $week['startDateFormatted'] }} - {{ $week['untilDateFormatted'] }}" {{ $selected }}>{{ $week['weekLabel'] }}</option>
                        @endforeach
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
