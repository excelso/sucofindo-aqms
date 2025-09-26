@section('title', 'Beranda')
<x-app-layout>
    <div class="content-main !max-w-full !p-0">
        <div class="absolute top-[4.5rem] right-[0.9rem] z-10">
            <div class="cursor-pointer bg-gray-100 rounded-md px-3 py-2 btnOpenNav">
                <i class="fas fa-list"></i>
            </div>
        </div>
        <div class="right-nav close">
            <div class="flex flex-col">
                <div class="right-nav-header border-bottom">
                    <input type="hidden" class="userLevel" value="{{ Auth::user()->user_level }}">
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
        <div class="h-[calc(100vh-7rem)]" id="map"></div>
    </div>
</x-app-layout>

@vite(['resources/js/main/dashboard/maps/index.tsx'])
