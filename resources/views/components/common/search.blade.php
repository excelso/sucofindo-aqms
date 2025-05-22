<div class="modal hidden modalSearch">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-search mr-2"></i> {{ __('Search') }}
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[400px]">
            {{ $slot }}
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="ds-btn ds-btn-error btnResetPencarian">
                    <i class="fas fa-refresh"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case btnCari">
                    <i class="fas fa-search mr-2"></i> Search
                </button>
            </div>
        </div>
    </div>
</div>
