@section('title', 'Beranda')
<x-app-layout>
    <div class="content-main !max-w-full !p-0">
        <!--region Main Panel -->
        <div class="absolute top-[1.5rem] right-[5.9rem] z-10">
            <div id="dropdownProjectButton" data-dropdown-toggle="dropdownProject" data-dropdown-offset-skidding="-60" class="dropdown-button cursor-pointer bg-white px-3 py-2" type="button">
                <div class="flex items-center capitalize">
                    Platforms <i class="fas fa-angle-down ml-2"></i>
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
                        <a rel="alternate" href="{{ route('sparing.dashboard') }}">
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

        <div class="absolute top-[1.3rem] right-[2.3rem] z-10">
            <div id="dropdownAvatarButton" data-dropdown-toggle="dropdownAvatar" data-dropdown-offset-skidding="-90" class="dropdown-button cursor-pointer !bg-white border" type="button">
                <span class="sr-only">Open user menu</span>
                <div class="avatar !bg-white !text-black">
                    <span>{{ substr(request()->user()->nama_lengkap, 0, 1)}}</span>
                </div>
            </div>

            <div id="dropdownAvatar" class="dropdown-panel w-[250px]">
                <div class="dropdown-header">
                    <div class="font-medium truncate">
                        {{ request()->user()->nama_lengkap }}
                    </div>
                    <div class="truncate">{{request()->user()->email}}</div>
                </div>
                <div class="dropdown-footer">
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <a href="javascript:void(0)" onclick="event.preventDefault(); this.closest('form').submit();">Logout</a>
                    </form>
                </div>
            </div>
        </div>
        <!-- endregion -->

        <!--region Fix Left Panel -->
        <div class="absolute top-0 bottom-0 left-0 z-10 w-[80px] bg-gray-100 flex items-center flex-col">
            <div class="mt-5">
                <div class="cursor-pointer bg-gray-100 rounded-md px-3 py-2">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M3 6h18"/>
                        <path d="M3 12h18"/>
                        <path d="M3 18h18"/>
                    </svg>
                </div>
            </div>
            <div class="cursor-pointer flex items-center flex-col mt-5 btnListSparing">
                <div class="bg-gray-100 rounded-md px-3 py-2">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>
                        <path d="M3 18c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>
                    </svg>
                </div>
                <div class="font-bold text-[11px] mt-1">SPARING</div>
            </div>
            <div class="cursor-pointer flex items-center flex-col mt-5 btnListAqms">
                <div class="bg-gray-100 rounded-md px-3 py-2">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12h10a3 3 0 1 0-3-3"/>
                        <path d="M3 18h14a3 3 0 1 1-3 3"/>
                    </svg>
                </div>
                <div class="font-bold text-[11px] mt-1">AQMS</div>
            </div>
        </div>
        <!--endregion-->

        <div class="left-panel absolute top-0 bottom-0 left-[5rem] z-10 w-[380px] bg-white shadow-md">
            <div class="mt-24 px-7 pb-5 font-bold platformFromTitle">Enviro</div>
            <div class="mx-7 flex items-center flex-row flex-nowrap overflow-x-auto gap-2 pb-4">
                <div class="btn-status active" data-status="1">
                    <span class="font-bold text-[13px]">All</span>
                </div>
                <div class="btn-status" data-status="2">
                    <span class="font-bold text-[13px]">Online <span class="totalOnline"></span></span>
                </div>
                <div class="btn-status" data-status="3">
                    <span class="font-bold text-[13px]">Offline <span class="totalOffline"></span></span>
                </div>
            </div>
            <div class="border-t h-[1px]"></div>
            <div class="px-4 py-3 h-[calc(100vh-12rem)] overflow-y-auto platformItems">

            </div>
        </div>

        <div class="searchBox absolute top-[0.8rem] left-[6rem] z-10">
            <div class="flex items-center gap-2">
                <div class="relative w-[350px]">
                    <div class="bg-white rounded-2xl border border-gray-200 ps-3 pe-2 py-2.5">
                        <div class="flex items-center gap-2 ">
                            <div class="ml-2">
                                <i class="fas fa-search mt-[4px] !text-[20px] text-gray-600"></i>
                            </div>
                            <input type="text" class="searchInput bg-transparent w-full focus:ring-0 border-0 focus:border-0 text-[14px] px-0 py-1" placeholder="Search...">
                            <div class="cursor-pointer mr-2 searchLoader !hidden">
                                <i class="fas fa-spinner fa-pulse mt-[4px] !text-[20px] text-gray-600"></i>
                            </div>
                            <div class="cursor-pointer mr-2 btnCloseSearch opacity-0">
                                <i class="fas fa-close mt-[4px] !text-[20px] text-gray-600"></i>
                            </div>
                        </div>

                        <div class="absolute hidden left-0 right-0 mt-2 bg-white rounded-b-2xl border border-gray-200 gm-card overflow-hidden">
                            <!-- list -->
                            <div id="resultsList" class="max-h-80 overflow-auto py-2">
                                x
                            </div>
                        </div>
                    </div>
                </div>

                <div class="list-site !hidden flex items-center gap-2 ml-5">
                    <div class="list-item">
                        <div class="flex items-center">
                            <div class="relative inline-flex items-center justify-center w-7 h-7 overflow-hidden bg-gray-500 rounded-full">
                                <span class="font-bold text-gray-100 text-[12px]">G</span>
                            </div>
                            <span class="list-item-text">
                            Gurimbang
                        </span>
                        </div>
                    </div>
                    <div class="list-item is-open">
                        <div class="flex items-center">
                            <div class="relative inline-flex items-center justify-center w-7 h-7 overflow-hidden bg-gray-500 rounded-full">
                                <span class="font-bold text-gray-100 text-[12px]">L</span>
                            </div>
                            <span class="list-item-text">
                            Lati
                        </span>
                        </div>
                    </div>
                    <div class="list-item">
                        <div class="flex items-center">
                            <div class="relative inline-flex items-center justify-center w-7 h-7 overflow-hidden bg-gray-500 rounded-full">
                                <span class="font-bold text-gray-100 text-[12px]">S</span>
                            </div>
                            <span class="list-item-text">
                            Sambirata
                        </span>
                        </div>
                    </div>
                    <div class="list-item">
                        <div class="flex items-center">
                            <div class="relative inline-flex items-center justify-center w-7 h-7 overflow-hidden bg-gray-500 rounded-full">
                                <span class="font-bold text-gray-100 text-[12px]">B</span>
                            </div>
                            <span class="list-item-text">
                            Binungan
                        </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="right-nav close">
            <div class="flex flex-col">
                <div class="right-nav-header border-bottom">
                    <input type="hidden" class="userLevel" value="{{ request()->user()->user_level }}">
                    <div class="cursor-pointer px-[5px] mt-[1px] loaderSearch">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="w-full">
                        <label>
                            <input type="text" class="form-control searchPlatform" placeholder="Tulis Pencarian..."/>
                        </label>
                    </div>
                    <div class="cursor-pointer px-[10px] mt-[1px] btnCloseNav">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
                <div class="h-[calc(100vh-11.8rem)]">
                    <div class="right-nav-items h-[calc(100vh-11.8rem)] overflow-y-auto bodyPlatforms">

                    </div>
                </div>
            </div>
        </div>
        <div class="h-screen" id="map"></div>
    </div>
</x-app-layout>

@vite(['resources/js/main/be-enviro/dashboard/index.tsx'])
