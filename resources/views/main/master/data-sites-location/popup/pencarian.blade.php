<div class="modal hidden modalPencarian">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-search mr-2"></i> Search
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
                <label>Company Name</label>
                <label class="form-group-control">
                    <select class="form-select select2-custom srcCompanyId" disabled>
                        <option value="">...</option>
                        @if(isset($companies))
                            @if($companies->count() == 1)
                                <option value="{{ $companies[0]->id }}" selected>{{ $companies[0]->company_name }}</option>
                            @else
                                @foreach($companies as $item)
                                    <option value="{{ $item->id }}">{{ $item->company_name }}</option>
                                @endforeach
                            @endif
                        @endif
                    </select>
                </label>
            </div>
            <div class="form-group">
                <label>Site Name</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom srcCompanySiteId" name="site_id" data-selected="{{ request()->input('site_id') }}">
                        <option value="">...</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Location Name</label>
                <div class="form-group-control">
                    <input type="text" class="form-control" name="location_name" value="{{ request()->input('location_name') }}" placeholder="..."/>
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
