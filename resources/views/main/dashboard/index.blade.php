@section('title', 'Beranda')
<x-app-layout>
    <div class="content-main-dashboard relative">
        <div class="absolute left-0 right-0 z-0">
            <div class="relative !h-[calc(100vh/2)] overflow-hidden">
                <div class="absolute inset-0 bg-sky-200/60 z-10"></div>
                <img src="{{ asset('images/bg-dashboard.png') }}" alt="bg"
                    class="absolute h-[95%] w-auto right-0 bottom-0 object-contain">
            </div>
        </div>

        <div class="relative px-8 py-4">
            <div class="py-8">
                <input type="hidden" class="app_env" value="{{ $env ?? 'local' }}">
                <div class="text-[28px] font-bold">Good Morning, {{ Common::ambilNama(Auth::user()->nama_lengkap) }}</div>
                <div class="text-[15px] font-normal text-gray-500">Let's dive into air quality awareness.</div>
            </div>
            <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center gap-2 text-[15px] font-bold">
                    <div>
                        <i class="fas fa-eye"></i>
                    </div>
                    <div>Watchlist (12)</div>
                </div>

                <div class="flex items-center gap-2 text-[15px] font-bold">
                    <div>
                        <i class="fas fa-sort"></i>
                    </div>
                    <div class="leading-[2px]">Filter</div>
                </div>
            </div>
            <div class="mt-5">
                <div class="airQualityParent grid md:grid-cols-2 sm:grid-cols-1 grid-cols-3 gap-4"></div>
            </div>
        </div>

        @include('main.dashboard.popup.cctv')
        @include('main.dashboard.popup.cctv-record')
        @include('main.dashboard.popup.detail-parameter')
        @include('main.dashboard.popup.heartbeat-status')
        @include('main.dashboard.popup.maps')
    </div>
</x-app-layout>

@vite(['resources/js/main/dashboard/index.tsx'])
