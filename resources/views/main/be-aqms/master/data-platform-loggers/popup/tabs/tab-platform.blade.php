<div id="tabPlatform">
    <div class="hidden p-5 rounded-lg" id="platform">
        <div class="form-group">
            <label>
                Company Name
                <span class="text-red-500 ml-1">*</span>
            </label>
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
        <div class="grid grid-cols-2 gap-4">
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
                <div class="form-group-control">
                    <select class="form-select select2-custom companySiteLocationId">
                        <option value="">...</option>
                    </select>
                </div>
                <ul class="companySiteLocationIdError"></ul>
            </div>
        </div>
        <div class="form-group">
            <label>
                UID
                <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="form-group-control">
                <input type="hidden" class="uidOld">
                <input type="text" class="form-control uid" placeholder="...">
            </div>
            <ul class="uidError"></ul>
        </div>
        <div class="form-group">
            <label>
                Platform name
                <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="form-group-control">
                <input type="text" class="form-control uidAlias" placeholder="...">
            </div>
            <ul class="uidAliasError"></ul>
        </div>
        <div class="form-group">
            <label>Thumbnail</label>
            <div class="rounded-[5px] border-[1px] border-gray-300 mt-1.5 mb-1">
                <div class="flex items-center">
                    <input type="file" id="fileThumbnail" accept="image/*" class="hidden fileThumbnail" />
                    <label for="fileThumbnail" class="flex items-center justify-center py-[12px] px-[15px] text-sm font-medium text-white bg-gray-800 rounded-l-[5px] cursor-pointer hover:bg-gray-700">
                        <span>Choose File</span>
                    </label>
                    <label for="fileThumbnail" id="fileName" class="flex-1 px-3 text-sm !font-normal cursor-pointer text-gray-500 truncate">
                        No File Selected
                    </label>
                </div>
            </div>
            <div class="info-alert-text">
                <div class="mr-1"><i class="fas fa-info-circle"></i></div>
                <div>{{ __('Upload Thumbnail file. Max 5 MB.') }}</div>
            </div>
            <ul class="fileThumbnailError"></ul>
        </div>
        <div class="form-group">
            <label>
                Timezone
                <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="form-group-control">
                <select class="form-select select2-custom platformTimezone">
                    <option value="">...</option>
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Makassar">Asia/Makassar</option>
                    <option value="Asia/Jayapura">Asia/Jayapura</option>
                </select>
            </div>
            <ul class="platformTimezoneError"></ul>
        </div>
    </div>
</div>
