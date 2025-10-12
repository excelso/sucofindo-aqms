<div class="modal hidden modalForm">
    <div class="modal-main">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-plus-circle mr-2"></i> {{ __('New Location') }}
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-17rem)]">
            <div class="form-group">
                <label>Company Name</label>
                <label class="form-group-control">
                    <select class="form-select select2-custom companyId" disabled>
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
                <ul class="companyIdError"></ul>
            </div>
            <div class="form-group">
                <label>
                    Site Name
                    <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="form-group-control">
                    <select class="form-select select2-custom companySiteId">
                        <option value="">...</option>
                    </select>
                </div>
                <ul class="companySiteIdError"></ul>
            </div>
            <div class="form-group">
                <label>
                    Location Name
                    <span class="text-red-500 ml-1">*</span>
                </label>
                <label class="form-group-control">
                    <input type="hidden" class="siteLocationId"/>
                    <input type="text" class="form-control locationName" placeholder="..."/>
                </label>
                <ul class="locationNameError"></ul>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="btn btn-error text-white hidden btnDelete">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
            <div class="ml-auto">
                <button class="btn btn-primary btnSave">
                    <i class="fas fa-save mr-2"></i> Save
                </button>
            </div>
        </div>
    </div>
</div>
