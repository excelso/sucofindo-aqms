<aside class="main-sidebar darkMode">
    <div class="brand">
        <img alt="logo" src="{{ asset('images/logo-color.png') }}" class="brand-logo"/>
        <h2 class="brand-label">HRMS</h2>
    </div>
    <div class="sidebar">
        <ul class="metismenu" id="menu">
            <li class="navItem">
                <a href="/" class="navLink {{Request::segment(1) == '' || Request::segment(1) == 'summary' ? 'navLinkActive' : ''}}">
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
            <li class="navItem {{Request::segment(1) == 'reports' ? 'mm-active' : ''}}">
                <a class="navLink {{Request::segment(1) == 'reports' ? 'navLinkActive' : ''}}">
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
                        <a class="navLink {{Request::segment(1) == 'reports' && Request::segment(2) == 'logs-parameter' ? 'navLinkActive' : ''}}" href="/reports/logs-parameter">
                            <div class="navText">
                                <p>Logs Parameter</p>
                            </div>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</aside>
