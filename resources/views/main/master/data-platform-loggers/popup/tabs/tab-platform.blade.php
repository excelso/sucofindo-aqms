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
                UID
                <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="form-group-control">
                <input type="hidden" class="uidOld">
                <input type="text" class="form-control uid" placeholder="...">
            </div>
            <ul class="uidError"></ul>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
                <label>CCTV Link (RTC)</label>
                <div class="form-group-control">
                    <input type="text" class="form-control cctvLink" placeholder="...">
                    <div class="form-control-append">
                        <div class="form-control-append-icon">
                            <a class="cursor-pointer btnCheckLink">
                                <i class="fas fa-external-link"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <ul class="cctvLinkError"></ul>
            </div>
            <div class="form-group">
                <label>CCTV Link (HLS)</label>
                <div class="form-group-control">
                    <input type="text" class="form-control cctvLinkHls" placeholder="...">
                    <div class="form-control-append">
                        <div class="form-control-append-icon">
                            <a class="cursor-pointer btnCheckLinkHls">
                                <i class="fas fa-external-link"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <ul class="cctvLinkHlsError"></ul>
            </div>
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
