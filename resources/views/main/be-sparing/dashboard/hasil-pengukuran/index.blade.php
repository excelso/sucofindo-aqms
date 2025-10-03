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
                            <a href="/dashboard/hasil-pengukuran">Lihat Detail</a>
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
                            <a href="/dashboard/hasil-pengukuran?status_platform=1">Lihat Detail</a>
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
                            <a href="/dashboard/hasil-pengukuran?status_platform=2">Lihat Detail</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-1 gap-4 platformContents"></div>
            <div class="loading mt-10">
                <div class="flex justify-center items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span class="ml-2">Loading more data...</span>
                </div>
            </div>
            {{-- <div class="grid grid-cols-2 gap-4"> --}}
            {{--     @foreach($dataLogger as $item) --}}
            {{--         <div class="col-span-1 platforms" data-uid="{{ $item->uid }}"> --}}
            {{--             <div class="card !mb-0"> --}}
            {{--                 <div class="card-header border-b"> --}}
            {{--                     <div class="w-[50%]"> --}}
            {{--                         <div class="font-bold text-[18px]">{{ $item->uid }}</div> --}}
            {{--                     </div> --}}
            {{--                     <div class="flex items-center !hidden"> --}}
            {{--                         <div class="flex items-center cursor-pointer mr-2 btnTemperature"> --}}
            {{--                             <div class="leading-[10px] text-[14px]">Temp: --}}
            {{--                                 <span class="nilaiTemperature">0</span>°C --}}
            {{--                             </div> --}}
            {{--                             <i class="fas fa-temperature-half !text-[20px] iconTemperature ml-2"></i> --}}
            {{--                         </div> --}}
            {{--                     </div> --}}
            {{--                 </div> --}}
            {{--                 <div class="card-body"> --}}
            {{--                     <div class="grid grid-cols-3 gap-4 mt-5 mb-10"> --}}
            {{--                         <div class="col-span-1"> --}}
            {{--                             <div class="flex items-center justify-center"> --}}
            {{--                                 <div class="radial-progress primary !w-[75px] !h-[75px] text-[12px] progressDataMasuk"> --}}
            {{--                                     <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div> --}}
            {{--                                 </div> --}}
            {{--                                 <div class="ml-2"> --}}
            {{--                                     <div class="text-[12px]">Total Masuk</div> --}}
            {{--                                     <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMasuk"> --}}
            {{--                                         <div class="skeleton-box w-[80px] !h-6 rounded"></div> --}}
            {{--                                     </div> --}}
            {{--                                 </div> --}}
            {{--                             </div> --}}
            {{--                         </div> --}}
            {{--                         <div class="col-span-1"> --}}
            {{--                             <div class="flex items-center justify-center"> --}}
            {{--                                 <div class="radial-progress success !w-[75px] !h-[75px] text-[12px] progressDataMutu"> --}}
            {{--                                     <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div> --}}
            {{--                                 </div> --}}
            {{--                                 <div class="ml-2"> --}}
            {{--                                     <div class="text-[12px]">Data Sesuai</div> --}}
            {{--                                     <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMutu"> --}}
            {{--                                         <div class="skeleton-box w-[80px] !h-6 rounded"></div> --}}
            {{--                                     </div> --}}
            {{--                                 </div> --}}
            {{--                             </div> --}}
            {{--                         </div> --}}
            {{--                         <div class="col-span-1"> --}}
            {{--                             <div class="flex items-center justify-center"> --}}
            {{--                                 <div class="radial-progress danger !w-[75px] !h-[75px] text-[12px] progressDataTidakMutu"> --}}
            {{--                                     <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div> --}}
            {{--                                 </div> --}}
            {{--                                 <div class="ml-2"> --}}
            {{--                                     <div class="text-[12px]">Tidak Sesuai</div> --}}
            {{--                                     <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataTidakMutu"> --}}
            {{--                                         <div class="skeleton-box w-[80px] !h-6 rounded"></div> --}}
            {{--                                     </div> --}}
            {{--                                 </div> --}}
            {{--                             </div> --}}
            {{--                         </div> --}}
            {{--                     </div> --}}
            {{--                     <div class="bodyChart !h-[425px]"></div> --}}
            {{--                 </div> --}}
            {{--             </div> --}}
            {{--         </div> --}}
            {{--     @endforeach --}}
            {{-- </div> --}}
        </div>

        @include('main.be-sparing.dashboard.hasil-pengukuran.popup.pencarian')
        @include('main.be-sparing.dashboard.hasil-pengukuran.popup.data-detail')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/dashboard/hasil-pengukuran/index.tsx'])
