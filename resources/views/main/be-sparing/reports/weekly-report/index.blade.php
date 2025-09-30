@section('title', 'Weekly Report')
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
                            <li>Weekly Report</li>
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
            <div class="grid sm:grid-cols-1 gap-4 cardLastParam" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
                <div class="col-span-1 cardColsPh">
                    <div class="card cardPh">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">pH (Avg)</span>
                                <span class="ds-badge ds-badge-outline ds-badge-success text-[12px] ml-2 phIntermit hidden">Intermittent</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="cardNilaiPh">0</div>
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-droplet"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-1 cardColsTss">
                    <div class="card cardTss">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">TSS (Avg)</span>
                                <span class="ds-badge ds-badge-outline ds-badge-success text-[12px] ml-2 tssIntermit hidden">Intermittent</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate">
                                <div class="cardNilaiTss mr-1">0</div>mg/L
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-droplet"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-1 cardColsDebit">
                    <div class="card cardDebit">
                        <div class="card-body">
                            <div class="flex items-center">
                                <span class="font-bold">Debit (Avg)</span>
                                <span class="ds-badge ds-badge-outline ds-badge-success text-[12px] ml-2 debitIntermit hidden">Intermittent</span>
                            </div>
                            <div class="flex items-center font-bold text-[1.75rem] truncate z-[10]">
                                <div class="cardNilaiDebit mr-1">0</div> m<sup>3</sup>/Menit
                            </div>
                            <div class="absolute right-[20px] top-[10px] text-[60px] opacity-[0.1]">
                                <i class="fas fa-droplet"></i>
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
                                    Data Masuk
                                </div>
                            </div>
                            @if(Auth::user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportChart">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <input type="hidden" class="userLevel" value="{{ Auth::user()->user_level }}">
                            <input type="hidden" class="platformUidSelected" value="{{ request()->input('platformUid') ?? $dataPlatform[0]->uid }}">
                            <input type="hidden" class="tipeLoggerSelected" value="{{ request()->input('tipeLogger') ?? $dataPlatform[0]->tipe_logger }}">
                            <input type="hidden" class="parameterIdSelected" value="{{ request()->input('parameterId') ?? 'pH' }}">
                            <input type="hidden" class="bulanSelected" value="{{ request()->input('bulan') ?? \Carbon\Carbon::now()->format('m') }}">
                            <input type="hidden" class="tahunSelected" value="{{ request()->input('tahun') ?? \Carbon\Carbon::now()->format('Y') }}">

                            <div class="loaderDataEntry absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
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
                                    Data Comply
                                </div>
                            </div>
                            @if(Auth::user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportChartComply">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataComply absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                            </div>
                            <div class="bodyChartComply !h-[400px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Data pH
                                </div>
                            </div>
                            @if(Auth::user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportPH">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataPH absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                            </div>
                            <div class="bodyChartPH !h-[400px]"></div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Data TSS
                                </div>
                            </div>
                            @if(Auth::user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportTSS">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataTSS absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                            </div>
                            <div class="bodyChartTSS !h-[400px]"></div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header !pb-0 mb-4">
                            <div class="w-[50%]">
                                <div class="font-bold text-[18px]">
                                    Data Debit
                                </div>
                            </div>
                            @if(Auth::user()->user_level != 'viewer')
                                <div class="flex items-center">
                                    <a class="btnExportDebit">
                                        <i class="fas fa-cloud-download mr-2"></i>
                                    </a>
                                </div>
                            @endif
                        </div>

                        <div class="card-body w-full">
                            <div class="loaderDataDebit absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                            </div>
                            <div class="bodyChartDebit !h-[400px]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        @include('main.be-sparing.reports.weekly-report.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/reports/weekly-report/index.tsx'])
