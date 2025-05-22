<div class="wrapper sm:sidebar-collapsed sidebar-mini">
    <nav class="nav-bar main-header">
        <div class="header-container">
            <div class="flex">
                <div class="p-[10px] ml-[5px] cursor-pointer toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </div>
            </div>

            <div class="flex items-center">
                <div class="p-[10px]">
                    <div id="dropdownLangButton" data-dropdown-toggle="dropdownLang" data-dropdown-offset-skidding="-60" class="dropdown-button cursor-pointer" type="button">
                        <div class="flex items-center capitalize">
                            @php($imgLocale = asset('images/locales/en.png'))
                            @if(LaravelLocalization::getCurrentLocale() == 'id')
                                @php($imgLocale = asset('images/locales/id.png'))
                            @endif
                            <img src="{{ $imgLocale }}" class="mr-2" alt="en" width="24">
                            <span class="sm:hidden">{{ LaravelLocalization::getCurrentLocale() }}</span>
                        </div>
                    </div>

                    <div id="dropdownLang" class="dropdown-panel w-[250px]">
                        <ul aria-labelledby="dropdown">
                            @foreach(LaravelLocalization::getSupportedLocales() as $localeCode => $properties)
                                @php($imgLocale = asset('images/locales/en.png'))
                                @if($localeCode == 'id')
                                    @php($imgLocale = asset('images/locales/id.png'))
                                @endif
                                <li>
                                    <a rel="alternate" hreflang="{{ $localeCode }}" href="{{ LaravelLocalization::getLocalizedURL($localeCode, null, [], true) }}">
                                        <div class="flex items-center">
                                            <img src="{{ $imgLocale }}" class="mr-2" alt="en" width="24"> {{ $properties['native'] }}
                                        </div>
                                    </a>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>

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
            AQMS @2024
        </div>
        <div>
            Powered by SUCOFINDO
        </div>
    </footer>
    <div class="sidebar-overlay"></div>
    <div class="notifbar-overlay"></div>
</div>
