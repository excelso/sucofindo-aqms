@section('title', 'Change Password')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Change Password
                    </p>
                    <nav aria-label="Breadcrumb">
                        <ul class="breadcrumb truncate">
                            <li>
                                <a href="{{ url('/') }}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                </a>
                            </li>
                            <li>Settings</li>
                            <li>Change Password</li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>

        <div class="content-body">
            <div class="!w-[30%]">
                <div class="form-group !bg-transparent">
                    <label>Old Password</label>
                    <label class="form-group-control relative !bg-white">
                        <input type="password" class="form-control passwordLama" placeholder="...">
                        <div class="form-control-append !bg-white">
                            <a class="form-control-append-icon btnLookPasswordLama">
                                <i class="fas fa-eye-slash"></i>
                            </a>
                        </div>
                    </label>
                    <ul class="passwordLamaError"></ul>
                </div>
                <div class="form-group !bg-transparent">
                    <label>New Password</label>
                    <div class="form-group-control relative !bg-white">
                        <input type="password" class="form-control passwordBaru" placeholder="...">
                        <div class="form-control-append !bg-white">
                            <a class="form-control-append-icon btnLookPasswordBaru">
                                <i class="fas fa-eye-slash"></i>
                            </a>
                        </div>
                    </div>
                    <ul class="passwordBaruError"></ul>
                </div>
                <div class="form-group !bg-transparent">
                    <label>Confirm New Password</label>
                    <div class="form-group-control relative !bg-white">
                        <input type="password" class="form-control rePasswordBaru" placeholder="...">
                        <div class="form-control-append !bg-white">
                            <a class="form-control-append-icon btnLookRePasswordBaru">
                                <i class="fas fa-eye-slash"></i>
                            </a>
                        </div>
                    </div>
                    <ul class="rePasswordBaruError"></ul>
                    <div class="info-alert-text">
                        <div><i class="fas fa-info-circle mr-1"></i></div>
                        <div>Repeat the above new password</div>
                    </div>
                </div>
                <div class="form-group mt-4">
                    <button class="ds-btn ds-btn-primary normal-case btnSimpan !w-full">
                        Save Change
                    </button>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

@vite(['resources/js/main/settings/change-password/index.tsx'])
