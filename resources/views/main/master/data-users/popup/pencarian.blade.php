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
                <label>User Type</label>
                <label class="form-group-control">
                    <select name="tipe_user" class="form-control select2-custom">
                        <option value="">...</option>
                        <option value="1" {{ request()->input('tipe_user') == '1' ? 'selected' : '' }}>SSO</option>
                        <option value="2" {{ request()->input('tipe_user') == '2' ? 'selected' : '' }}>Non SSO</option>
                    </select>
                </label>
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <label class="form-group-control">
                    <input name="full_name" class="form-control" value="{{isset($_GET['full_name']) && $_GET['full_name'] != '' ? $_GET['full_name'] : ''}}" placeholder="..."/>
                </label>
            </div>
            <div class="form-group">
                <label>SID Code / Email</label>
                <label class="form-group-control">
                    <input name="email" class="form-control" value="{{isset($_GET['email']) && $_GET['email'] != '' ? $_GET['email'] : ''}}" placeholder="..."/>
                </label>
            </div>
            <div class="form-group">
                <label>Role</label>
                <label class="form-group-control">
                    <select name="role" class="form-control select2-custom">
                        <option value="">...</option>
                        <option value="super_admin" {{isset($_GET['role']) && $_GET['role'] == 'super_admin' ? 'selected' : ''}}>HO BC</option>
                        <option value="admin" {{isset($_GET['role']) && $_GET['role'] == 'admin' ? 'selected' : ''}}>Enviro BC Site</option>
                        <option value="viewer" {{isset($_GET['role']) && $_GET['role'] == 'viewer' ? 'selected' : ''}}>MK Enviro Site</option>
                    </select>
                </label>
            </div>
            <div class="form-group">
                <label>Status User</label>
                <label class="form-group-control">
                    <select name="status" class="form-control select2-custom">
                        <option value="">...</option>
                        <option value="Active" {{isset($_GET['status']) && $_GET['status'] == 'Active' ? 'selected' : ''}}>Active</option>
                        <option value="Suspend" {{isset($_GET['status']) && $_GET['status'] == 'Suspend' ? 'selected' : ''}}>Suspend</option>
                        <option value="Non Active" {{isset($_GET['status']) && $_GET['status'] == 'Non Active' ? 'selected' : ''}}>Non Active</option>
                    </select>
                </label>
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
