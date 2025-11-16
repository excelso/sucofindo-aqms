@section('title', 'Hasil Pengukuran')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Hasil Pengukuran
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
                            <li>Dashboard</li>
                            <li>Hasil Pengukuran</li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div class="flex flex-row items-center">
                <div class="mr-3">
                    <a class="cursor-pointer btnPencarian ml-2">
                        <i class="fas fa-search mr-2"></i> Pencarian
                    </a>
                </div>
            </div>
        </div>

        <div class="content-body">
            <div class="grid grid-cols-3 gap-4">
                <div class="col-span-1">
                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">Total Checkpoint</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="titikPenataan">0</div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-location-dot"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="/sparing/dashboard/hasil-pengukuran">Lihat Detail</a>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">Checkpoint Online</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="titikOnline">0</div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-circle-up !text-green-500"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="/sparing/dashboard/hasil-pengukuran?status_platform=online">Lihat Detail</a>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">Checkpoint Offline</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="titikOffline">0</div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-circle-down !text-red-500"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="/sparing/dashboard/hasil-pengukuran?status_platform=offline">Lihat Detail</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="platformContents"></div>
            <div class="loading mt-10 hidden">
                <div class="flex justify-center items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span class="ml-2">Loading more data...</span>
                </div>
            </div>
        </div>

        @include('main.be-sparing.dashboard.hasil-pengukuran.popup.pencarian')
        @include('main.be-sparing.dashboard.hasil-pengukuran.popup.data-detail')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/dashboard/hasil-pengukuran/index.tsx'])
