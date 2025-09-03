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
                <label>Date Period</label>
                <div class="form-group-control">
                    <input type="text" class="form-control date" name="date" value="{{ request()->input('date') ?? \Carbon\Carbon::now()->format('Y-m-d') }}" placeholder="..."/>
                    <div class="form-control-append btnStartDate">
                        <span class="form-control-append-icon">
                            <i class="fas fa-calendar"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="ds-btn ds-btn-error btnResetSearch">
                    <i class="fas fa-refresh"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button class="ds-btn ds-btn-primary normal-case btnSearch">
                    <i class="fas fa-search mr-2"></i> Cari
                </button>
            </div>
        </div>
    </div>
</div>
