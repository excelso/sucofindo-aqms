@section('title', 'Data Weekly Report')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Weekly Report
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
                            <li>Reports</li>
                            <li>Weekly Report ( <strong>{{ request()->input('uid') ?? $platforms->uid }} </strong> )</li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div class="flex flex-row items-center">
                <div class="mr-3">
                    <a class="cursor-pointer btnSearch ml-2">
                        <i class="fas fa-search mr-2"></i> Search
                    </a>
                </div>
            </div>
        </div>

        <div class="content-body">
            <input type="hidden" class="uidSelected" value="{{ request()->input('platformUid') ?? $platforms->uid }}">
            <input type="hidden" class="bulanSelected" value="{{ request()->input('bulan') ?? \Carbon\Carbon::now()->format('m') }}">
            <input type="hidden" class="tahunSelected" value="{{ request()->input('tahun') ?? \Carbon\Carbon::now()->format('Y') }}">

            <div class="grid grid-cols-4 gap-4 cardLastParam">
                <div class="col-span-1 cardColsPm25">
                    <div class="card cardPm25">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">PM2.5 (Avg)</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="font-bold leading-[25px] mt-4 cardNilaiPm25">
                                    <div class="skeleton-box w-[130px] !h-6 rounded-md"></div>
                                </div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-cloud"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-1 cardColsPm10">
                    <div class="card cardPm10">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">PM10 (Avg)</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="font-bold leading-[25px] mt-4 cardNilaiPm10">
                                    <div class="skeleton-box w-[130px] !h-6 rounded-md"></div>
                                </div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-cloud"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-1 cardColsTsp">
                    <div class="card cardTsp">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">TSP (Avg)</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate z-[10]">
                                <div class="font-bold leading-[25px] mt-4 cardNilaiTsp">
                                    <div class="skeleton-box w-[130px] !h-6 rounded-md"></div>
                                </div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-cloud"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-1 cardColsNoise">
                    <div class="card cardNoise">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">Noise (Avg)</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate z-[10]">
                                <div class="font-bold leading-[25px] mt-4 cardNilaiNoise">
                                    <div class="skeleton-box w-[130px] !h-6 rounded-md"></div>
                                </div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-volume-high"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Data Entry
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportChart">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataEntry absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChart !h-[400px]"></div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Connectivity
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportChartConnect">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataConnect absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChartConnect !h-[400px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    PM 2.5
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportPm25">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataPm25 absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChartPm25 !h-[400px]"></div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    PM 10
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportPm10">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataPm10 absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChartPm10 !h-[400px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    TSP
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportTsp">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataTsp absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChartTsp !h-[400px]"></div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Noise
                                </div>
                            </div>
                            @if(request()->user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportNoise">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataNoise absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Please Wait...
                            </div>
                            <div class="bodyChartNoise !h-[400px]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Bagian Include (Modal) --}}
        @include('main.be-aqms.reports.data-weekly-report.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-aqms/reports/data-weekly-report/index.tsx'])
