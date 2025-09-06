<aside class="main-sidebar darkMode">
    <div class="brand">
        <img alt="logo" src="{{ asset('images/logo-white.png') }}" class="brand-logo"/>
        <h2 class="brand-label">BeAQMS</h2>
    </div>
    <div class="sidebar">
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
            <li class="navItem {{Request::segment(2) == 'reports' ? 'mm-active' : ''}}">
                <a class="navLink {{Request::segment(2) == 'reports' ? 'navLinkActive' : ''}}">
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
                        <a class="navLink {{Request::segment(2) == 'reports' && Request::segment(3) == 'logs-parameter' ? 'navLinkActive' : ''}}" href="/reports/logs-parameter">
                            <div class="navText">
                                <p>Logs Parameter</p>
                            </div>
                        </a>
                    </li>
                </ul>
            </li>
            <li class="navItem {{Request::segment(2) == 'master' ? 'mm-active' : ''}}">
                <a class="navLink {{Request::segment(2) == 'master' ? 'navLinkActive' : ''}}">
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
                        <a class="navLink {{Request::segment(2) == 'master' && Request::segment(3) == 'sites' ? 'navLinkActive' : ''}}" href="/master/sites">
                            <div class="navText">
                                <p>Sites</p>
                            </div>
                        </a>
                    </li>
                    <li class="navItem">
                        <a class="navLink {{Request::segment(2) == 'master' && Request::segment(3) == 'sites-location' ? 'navLinkActive' : ''}}" href="/master/sites-location">
                            <div class="navText">
                                <p>Location</p>
                            </div>
                        </a>
                    </li>
                    <li class="navItem">
                        <a class="navLink {{Request::segment(2) == 'master' && Request::segment(3) == 'platform-loggers' ? 'navLinkActive' : ''}}" href="/master/platform-loggers">
                            <div class="navText">
                                <p>Platform Loggers</p>
                            </div>
                        </a>
                    </li>
                    <li class="navItem">
                        <a class="navLink {{Request::segment(2) == 'master' && Request::segment(3) == 'users' ? 'navLinkActive' : ''}}" href="/master/users">
                            <div class="navText">
                                <p>Users</p>
                            </div>
                        </a>
                    </li>
                </ul>
            </li>

            <li class="navItem {{Request::segment(2) == 'settings' ? 'mm-active' : ''}}">
                <a class="navLink {{Request::segment(2) == 'settings' ? 'navLinkActive' : ''}}">
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
                        <a class="navLink {{Request::segment(2) == 'settings' && Request::segment(3) == 'change-password' ? 'navLinkActive' : ''}}" href="/settings/change-password">
                            <div class="navText">
                                <p>{{ __('Change Password') }}</p>
                            </div>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</aside>
