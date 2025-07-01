<div class="modal hidden modalForm">
    <div class="modal-main xl:!w-[40%] lg:!w-[40%] sm:!w-[90%]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-plus-circle mr-2"></i> {{ __('New Site') }}
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !p-0 !max-h-[calc(100vh-17rem)]">
            <div class="flex justify-between items-center border-b border-gray-200 sticky top-0 z-[1] bg-white">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" data-tabs-toggle="#tabUsers" data-role="exTabs">
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#user">
                            <i class="fas fa-user-circle mr-2"></i> Data User
                        </button>
                    </li>
                    <li class="mr-2">
                        <button class="inline-block p-4" data-tabs-target="#site-monitor">
                            <i class="fas fa-desktop mr-2"></i> Site Monitoring
                        </button>
                    </li>
                </ul>
            </div>

            <div id="tabUsers">
                <div class="hidden p-5 rounded-lg" id="user">
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
                        <label>User Type</label>
                        <div class="form-group-control">
                            <select class="form-control select2-custom tipeUser">
                                <option value="1">SSO</option>
                                <option value="2">Non SSO</option>
                            </select>
                        </div>
                    </div>
                    <div class="formSSO form-group">
                        <label>SID Code</label>
                        <div class="form-group-control relative">
                            <input type="text" class="form-control sidCode" placeholder="..."/>
                            <div class="form-control-append">
                                <div class="form-control-append-icon">
                                    <a class="flex items-center btnLookupSid">
                                        <i class="fas fa-search mr-2"></i> Cari
                                    </a>
                                </div>
                            </div>
                        </div>
                        <ul class="sidCodeError"></ul>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <label class="form-group-control">
                            <input type="hidden" class="userId"/>
                            <input type="text" class="form-control namaLengkap" placeholder="..."/>
                        </label>
                        <ul class="namaLengkapError"></ul>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <label class="form-group-control">
                            <input type="text" class="form-control emailUser" placeholder="..."/>
                            <input type="hidden" class="emailUserOld"/>
                        </label>
                        <ul class="emailUserError"></ul>
                    </div>
                    <div class="formNonSSO" style="display: none;">
                        <div class="form-group">
                            <label>Password</label>
                            <div class="form-group-control relative">
                                <input type="password" class="form-control passwordUser" placeholder="..."/>
                                <div class="form-control-append">
                                    <div class="form-control-append-icon">
                                        <a class="btnLookPassword">
                                            <i class="fas fa-eye-slash"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <ul class="passwordUserError"></ul>
                        </div>
                        <div class="form-group">
                            <label>Repeat Password</label>
                            <div class="form-group-control relative">
                                <input type="password" class="form-control rePasswordUser" placeholder="..."/>
                                <div class="form-control-append">
                                    <div class="form-control-append-icon">
                                        <a class="btnLookRePassword">
                                            <i class="fas fa-eye-slash"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <ul class="rePasswordUserError"></ul>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <div class="form-group-control">
                            <select class="form-control select2-custom roleId">
                                <option value="">...</option>
                                <option value="super_admin">HO BC</option>
                                <option value="admin">Enviro BC Site</option>
                                <option value="viewer">MK Enviro Site</option>
                            </select>
                        </div>
                        <ul class="roleIdError"></ul>
                    </div>
                    <div class="form-group">
                        <label>Status User</label>
                        <div class="form-group-control">
                            <select class="form-control select2-custom statusUser">
                                <option value="Active">Active</option>
                                <option value="Suspend">Suspend</option>
                                <option value="Non Active">Non Active</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="hidden rounded-lg" id="site-monitor">
                    <div class="flex p-5">
                        <div class="flex items-center">
                            <div class="form-group !mb-0">
                                <div class="form-group-control !mt-0">
                                    <input type="text" class="form-control searchInput" placeholder="Search...">
                                </div>
                            </div>
                            <div><i class="fas fa-search ml-2"></i></div>
                        </div>
                    </div>

                    <table class="table table-fixed tableSite">
                        <thead>
                            <tr class="sticky-header !top-[120px]">
                                <th class="text-center w-[30px] !border-l-[1px]">No</th>
                                <th class="text-left w-[150px]">Company Name / Site</th>
                                <th class="text-center w-[70px] !border-r-[1px]">
                                    <label>
                                        <input type="checkbox" class="checkAll">
                                        <input type="hidden" class="totalSite" value="{{ 0 }}">
                                    </label>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            @php($no = 0)
                            @foreach($companies as $item)
                                @php($no++)

                                <tr class="parent">
                                    <td class="text-center !border-l-[1px]">{{ $no }}</td>
                                    <td class="text-left">{{ $item->company_name }}</td>
                                    <td class="text-center !border-r-[1px]">
                                        <label>
                                            <input type="checkbox" class="checkCustomer" data-id="{{ $item->id }}" value="{{ $item->id }}">
                                        </label>
                                    </td>
                                </tr>

                                @foreach($item->sites as $site)
                                    <tr class="parent">
                                        <td class="text-center !border-l-[1px]"></td>
                                        <td class="text-left">
                                            <div class="ml-7">{{ $site->site_name }}</div>
                                        </td>
                                        <td class="text-center !border-r-[1px]">
                                            <label>
                                                <input type="checkbox" class="checkSite" data-parent="{{ $site->company_id }}" data-id="{{ $site->id }}" value="{{ $site->id }}">
                                            </label>
                                        </td>
                                    </tr>

                                    @foreach($site->platforms as $platform)
                                        <tr class="parent">
                                            <td class="text-center !border-l-[1px]"></td>
                                            <td class="text-left">
                                                <div class="ml-14">{{ $platform->uid }}</div>
                                            </td>
                                            <td class="text-center !border-r-[1px]">
                                                <label>
                                                    <input type="checkbox" class="checkPlatform" data-parent="{{ $platform->company_site_id }}" data-id="{{ $platform->id }}" value="{{ $platform->id }}">
                                                </label>
                                            </td>
                                        </tr>
                                        <tr class="child">
                                            <td class="text-center !border-l-[1px]"></td>
                                            <td class="text-left">
                                                <div class="ml-[5rem]">Internal</div>
                                            </td>
                                            <td class="text-center !border-r-[1px]">
                                                <label>
                                                    <input type="checkbox" class="typeLoggerIn" data-type-logger="true" data-parent="{{ $platform->company_site_id }}" data-parent-site="{{ $site->id }}" data-platform-id="{{ $platform->id }}" data-platform-uid="{{ $platform->uid }}" value="1">
                                                </label>
                                            </td>
                                        </tr>
                                        <tr class="child">
                                            <td class="text-center !border-l-[1px]"></td>
                                            <td class="text-left">
                                                <div class="ml-[5rem]">Re - Engineer</div>
                                            </td>
                                            <td class="text-center !border-r-[1px]">
                                                <label>
                                                    <input type="checkbox" class="typeLoggerRe" data-type-logger="true" data-parent="{{ $platform->company_site_id }}" data-parent-site="{{ $site->id }}" data-platform-id="{{ $platform->id }}" data-platform-uid="{{ $platform->uid }}" value="2">
                                                </label>
                                            </td>
                                        </tr>
                                    @endforeach
                                @endforeach
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div>
                <a class="btn btn-error text-white btnDelete" style="display: none;">
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
