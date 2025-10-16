<div class="wrapper sm:sidebar-collapsed sidebar-mini">
    <nav class="nav-bar main-header">
        <div class="header-container">
            <div class="flex">
                <div class="p-[10px] ml-[5px] cursor-pointer toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </div>
            </div>

            <div class="flex items-center">
                @if(session()->get('use_sparing') != 0 && session()->get('use_aqms') != 0)
                    <div class="p-[10px]">
                        <div id="dropdownProjectButton" data-dropdown-toggle="dropdownProject" data-dropdown-offset-skidding="-60" class="dropdown-button cursor-pointer" type="button">
                            <div class="flex items-center capitalize">
                                <span class="truncate sm:hidden">{{ request()->is('aqms*') ? 'BeAQMS' : 'BeSparing' }}</span>
                            </div>
                        </div>

                        <div id="dropdownProject" class="dropdown-panel overflow-y-auto max-h-[350px] w-[250px]">
                            <ul aria-labelledby="dropdown">
                                <li>
                                    <a rel="alternate" href="{{ route('enviro.dashboard') }}">
                                        <div class="flex items-center">
                                            <div class="ml-2 overflow-hidden">
                                                <div class="truncate">
                                                    BeEnviro Maps
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a rel="alternate" href="{{ route('aqms.dashboard') }}">
                                        <div class="flex items-center">
                                            <div class="ml-2 overflow-hidden">
                                                <div class="truncate">
                                                    BeAQMS
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a rel="alternate" href="{{ route('sparing.dashboard.hasil-pengukuran') }}">
                                        <div class="flex items-center">
                                            <div class="ml-2 overflow-hidden">
                                                <div class="truncate">
                                                    BeSparing
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                @endif

                <div class="py-[10px] px-[15px] relative cursor-pointer toggle-notif">
                    <div class="absolute top-[2px] right-[0px] data-count-notif hidden">
                        <div class="inline-flex justify-center items-center text-xs text-white bg-[#f66e6e] rounded-full min-w-[18px] h-[18px] p-[5px]">
                            <span class="count-notif">0</span>
                        </div>
                    </div>
                    <i class="far fa-bell text-[20px]"></i>
                </div>
                <div class="p-[10px]">
                    <div id="dropdownAvatarButton" data-dropdown-toggle="dropdownAvatar" data-dropdown-offset-skidding="-60" class="dropdown-button cursor-pointer" type="button">
                        <span class="sr-only">Open user menu</span>
                        <div class="avatar">
                             <span>{{ substr(Auth::user()->nama_lengkap, 0, 1)}}</span>
                        </div>
                    </div>

                    <div id="dropdownAvatar" class="dropdown-panel w-[250px]">
                        <div class="dropdown-header">
                            <div class="font-medium truncate">
                                 {{ Auth::user()->nama_lengkap }}
                            </div>
                             <div class="truncate">{{Auth::user()->email}}</div>
                        </div>
                        <ul aria-labelledby="dropdown">
                            <li>
                                <a href="/">Dashboard</a>
                            </li>
                            <li>
                                 <a href="{{ route('settings.change-password') }}">Ganti Password</a>
                            </li>
                        </ul>
                        <div class="dropdown-footer">
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <a href="javascript:void(0)" onclick="event.preventDefault(); this.closest('form').submit();">Logout</a>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    @include('layouts.sidebar')
    @include('layouts.notif')

    <div class="content-wrapper">
        {{ $slot }}
    </div>
    <footer class="footer-menu">
        <div>
            {{ request()->is('aqms*') ? 'BeAQMS' : 'BeSparing' }} @2024
        </div>
        <div>
            Powered by SUCOFINDO
        </div>
    </footer>
    <div class="sidebar-overlay"></div>
    <div class="notifbar-overlay"></div>
</div>
