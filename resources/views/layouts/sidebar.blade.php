<aside class="main-sidebar darkMode">
    <div class="brand">
        <img alt="logo" src="{{ asset('images/logo-white.png') }}" class="brand-logo"/>
        <h2 class="brand-label">{{ request()->is('*/aqms*') ? 'BeAQMS' : 'BeSparing' }}</h2>
    </div>
    <div class="sidebar">
        @if(request()->is('*/aqms*'))
            <ul class="metismenu" id="menu">
                <li class="navItem">
                    <a href="/" class="navLink {{Request::segment(2) == '' || Request::segment(2) == 'summary' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-house"></i>
                            </div>
                            <div class="navText">
                                <p>Beranda</p>
                            </div>
                        </div>
                    </a>
                </li>
                <li class="navItem {{Request::segment(3) == 'reports' ? 'mm-active' : ''}}">
                    <a class="navLink {{Request::segment(3) == 'reports' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-file-circle-check"></i>
                            </div>
                            <div class="navText">
                                <p>Reports</p>
                            </div>
                        </div>
                        <div class="navArrowDown">
                            <i class="fa fa-caret-right"></i>
                        </div>
                    </a>
                    <ul class="navTreeview">
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'reports' && Request::segment(4) == 'logs-parameter' ? 'navLinkActive' : ''}}" href="{{ route('reports.logs-parameter') }}">
                                <div class="navText">
                                    <p>Logs Parameter</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="navItem {{Request::segment(3) == 'master' ? 'mm-active' : ''}}">
                    <a class="navLink {{Request::segment(3) == 'master' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <div class="navText">
                                <p>Master</p>
                            </div>
                        </div>
                        <div class="navArrowDown">
                            <i class="fa fa-caret-right"></i>
                        </div>
                    </a>
                    <ul class="navTreeview">
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'master' && Request::segment(4) == 'sites' ? 'navLinkActive' : ''}}" href="{{ route('master.sites') }}">
                                <div class="navText">
                                    <p>Sites</p>
                                </div>
                            </a>
                        </li>
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'master' && Request::segment(4) == 'sites-location' ? 'navLinkActive' : ''}}" href="{{ route('master.sites-location') }}">
                                <div class="navText">
                                    <p>Location</p>
                                </div>
                            </a>
                        </li>
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'master' && Request::segment(4) == 'platform-loggers' ? 'navLinkActive' : ''}}" href="{{ route('master.platform-loggers') }}">
                                <div class="navText">
                                    <p>Platform Loggers</p>
                                </div>
                            </a>
                        </li>
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'master' && Request::segment(4) == 'users' ? 'navLinkActive' : ''}}" href="{{ route('master.users') }}">
                                <div class="navText">
                                    <p>Users</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="navItem {{Request::segment(3) == 'settings' ? 'mm-active' : ''}}">
                    <a class="navLink {{Request::segment(3) == 'settings' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-wrench"></i>
                            </div>
                            <div class="navText">
                                <p>Settings</p>
                            </div>
                        </div>
                        <div class="navArrowDown">
                            <i class="fa fa-caret-right"></i>
                        </div>
                    </a>
                    <ul class="navTreeview">
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'aqms' && Request::segment(3) == 'settings' && Request::segment(4) == 'change-password' ? 'navLinkActive' : ''}}" href="{{ route('settings.change-password') }}">
                                <div class="navText">
                                    <p>{{ __('Change Password') }}</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        @else
            <ul class="metismenu" id="menu">
                <li class="navItem {{Request::segment(3) == 'dashboard' ? 'mm-active' : ''}}">
                    <a class="navLink {{Request::segment(3) == 'dashboard' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-house"></i>
                            </div>
                            <div class="navText">
                                <p>Dashboard</p>
                            </div>
                        </div>
                        <div class="navArrowDown">
                            <i class="fa fa-caret-right"></i>
                        </div>
                    </a>
                    <ul class="navTreeview">
                        @if(in_array(request()->user()->user_level, ['super_admin', 'admin']))
                            <li class="navItem">
                                <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'dashboard' && Request::segment(3) == 'hasil-pengukuran' ? 'navLinkActive' : ''}}" href="/dashboard/hasil-pengukuran">
                                    <div class="navText">
                                        <p>Hasil Pengukuran</p>
                                    </div>
                                </a>
                            </li>
                        @endif
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'dashboard' && Request::segment(3) == 'maps' ? 'navLinkActive' : ''}}" href="{{ route('sparing.dashboard.maps') }}">
                                <div class="navText">
                                    <p>Peta Sebaran</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="navItem {{Request::segment(3) == 'reports' ? 'mm-active' : ''}}">
                    <a class="navLink {{Request::segment(3) == 'reports' ? 'navLinkActive' : ''}}">
                        <div class="flex items-center justify-start">
                            <div class="navIcon">
                                <i class="fas fa-file-circle-check"></i>
                            </div>
                            <div class="navText">
                                <p>Reports</p>
                            </div>
                        </div>
                        <div class="navArrowDown">
                            <i class="fa fa-caret-right"></i>
                        </div>
                    </a>
                    <ul class="navTreeview">
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'reports' && Request::segment(4) == 'logs-parameter' ? 'navLinkActive' : ''}}" href="{{ route('sparing.reports.logs-parameter') }}">
                                <div class="navText">
                                    <p>Logs Parameter</p>
                                </div>
                            </a>
                        </li>
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'reports' && Request::segment(4) == 'water-quality' ? 'navLinkActive' : ''}}" href="{{ route('sparing.reports.water-quality') }}">
                                <div class="navText">
                                    <p>Water Quality</p>
                                </div>
                            </a>
                        </li>
                        <li class="navItem">
                            <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'reports' && Request::segment(4) == 'weekly-report' ? 'navLinkActive' : ''}}" href="{{ route('sparing.reports.weekly-report') }}">
                                <div class="navText">
                                    <p>Weekly Report</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </li>

                @if(in_array(request()->user()->user_level, ['super_admin', 'admin']))
                    <li class="navItem {{Request::segment(3) == 'master' ? 'mm-active' : ''}}">
                        <a class="navLink {{Request::segment(3) == 'master' ? 'navLinkActive' : ''}}">
                            <div class="flex items-center justify-start">
                                <div class="navIcon">
                                    <i class="fas fa-briefcase"></i>
                                </div>
                                <div class="navText">
                                    <p>Master</p>
                                </div>
                            </div>
                            <div class="navArrowDown">
                                <i class="fa fa-caret-right"></i>
                            </div>
                        </a>
                        <ul class="navTreeview">
                            @if(request()->user()->user_level == 'super_admin')
                                <li class="navItem hidden">
                                    <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'master' && Request::segment(4) == 'customer' ? 'navLinkActive' : ''}}" href="/master/customer">
                                        <div class="navText">
                                            <p>Data Perusahaan</p>
                                        </div>
                                    </a>
                                </li>
                                <li class="navItem">
                                    <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'master' && Request::segment(4) == 'lokasi' ? 'navLinkActive' : ''}}" href="{{ route('sparing.master.lokasi') }}">
                                        <div class="navText">
                                            <p>Data Site / Lokasi</p>
                                        </div>
                                    </a>
                                </li>
                                <li class="navItem">
                                    <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'master' && Request::segment(4) == 'site' ? 'navLinkActive' : ''}}" href="{{ route('sparing.master.site') }}">
                                        <div class="navText">
                                            <p>Data WMP</p>
                                        </div>
                                    </a>
                                </li>
                            @endif
                            <li class="navItem">
                                <a class="navLink {{Request::segment(2) == 'sparing' && Request::segment(3) == 'master' && Request::segment(4) == 'logger' ? 'navLinkActive' : ''}}" href="{{ route('sparing.master.logger') }}">
                                    <div class="navText">
                                        <p>Data Logger</p>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </li>
                @endif
            </ul>
        @endif
    </div>
</aside>
