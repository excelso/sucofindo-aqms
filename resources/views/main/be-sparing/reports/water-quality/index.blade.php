@section('title', 'Water Quality')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Water Quality
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
                            <li>Water Quality</li>
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
            <div class="card z-[200]">
                <div class="card-header !pb-0 mb-4">
                    <div class="w-[50%]">
                        <div class="font-bold text-[18px]">
                            Data Chart
                        </div>
                    </div>
                    @if(Auth::user()->user_level != 'viewer')
                        <div class="flex items-center">
                            <a class="btnExportChart">
                                <i class="fas fa-cloud-download mr-2"></i> Export Chart
                            </a>
                        </div>
                    @endif
                </div>

                <div class="card-body w-full">
                    <input type="hidden" class="userLevel" value="{{ Auth::user()->user_level }}">
                    <input type="hidden" class="platformUidSelected" value="{{ request()->input('platformUid') ?? $dataPlatform[0]->uid }}">
                    <input type="hidden" class="tipeLoggerSelected" value="{{ request()->input('tipeLogger') ?? $dataPlatform[0]->tipe_logger }}">
                    <input type="hidden" class="parameterIdSelected" value="{{ request()->input('parameterId') ?? 'pH' }}">
                    <input type="hidden" class="minDateSelected" value="{{ request()->input('minDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 00:00' }}">
                    <input type="hidden" class="maxDateSelected" value="{{ request()->input('maxDate') ?? \Carbon\Carbon::now()->format('Y-m-d') . ' 23:59' }}">
                    <div class="grid grid-cols-3 sm:grid-cols-1 gap-4">
                        <div class="col-span-2 sm:col-span-1">
                            <div class="bodyChart !h-[400px]"></div>
                        </div>
                        <div class="col-span-1">
                            <div class="flex items-center mb-10">
                                <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                                <div class="text-[17px] font-bold">Persentase Data</div>
                            </div>
                            <div class="mb-5">
                                <div class="mb-2">Data Masuk</div>
                                <div class="skeleton-box w-[100%] !h-6 rounded loaderDataMasuk"></div>
                                <div class="w-full bg-gray-200 rounded h-6 dark:bg-gray-700 progressDataMasuk hidden">
                                    <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center py-1.5 leading-none rounded" style="width: 0">0%</div>
                                </div>
                            </div>
                            <div class="mb-5 !hidden">
                                <div class="mb-2">Data Tidak Masuk</div>
                                <div class="skeleton-box w-[100%] !h-6 rounded loaderDataTidakMasuk"></div>
                                <div class="w-full bg-gray-200 rounded h-6 dark:bg-gray-700 progressDataTidakMasuk hidden">
                                    <div class="bg-yellow-300 text-xs font-medium text-center py-1.5 leading-none rounded" style="width: 0">0%</div>
                                </div>
                            </div>
                            <div class="mb-5">
                                <div class="mb-2">Sesuai Nilai Check Point</div>
                                <div class="skeleton-box w-[100%] !h-6 rounded loaderDataMutu"></div>
                                <div class="w-full bg-gray-200 rounded h-6 dark:bg-gray-700 progressDataMutu hidden">
                                    <div class="bg-green-500 text-xs font-medium text-center text-white py-1.5 leading-none rounded" style="width: 0">0%</div>
                                </div>
                            </div>
                            <div class="mb-4">
                                <div class="mb-2">Diluar Nilai Check Point</div>
                                <div class="skeleton-box w-[100%] !h-6 rounded loaderDataTidakMutu"></div>
                                <div class="w-full bg-gray-200 rounded h-6 dark:bg-gray-700 progressDataTidakMutu hidden">
                                    <div class="bg-red-500 text-xs font-medium text-center text-white py-1.5 leading-none rounded" style="width: 0">0%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card z-[200]">
                <div class="card-header !pb-0 mb-4">
                    <div class="w-[50%]">
                        <div class="font-bold text-[18px] titleCardChart">
                            <div class="skeleton-box w-[20%] !h-[13px] rounded"></div>
                        </div>
                        <div class="text-[15px] titlePeriodeCardChart">
                            <div class="skeleton-box w-[40%] !h-[13px] rounded"></div>
                        </div>
                        <div class="text-[15px] titleTipeLoggerCardChart">
                            <div class="skeleton-box w-[40%] !h-[13px] rounded"></div>
                        </div>
                    </div>
                    @if(Auth::user()->user_level != 'viewer')
                        <div class="flex items-center">
                            <a class="btnExportTable cursor-pointer">
                                <i class="fas fa-cloud-download mr-2"></i> Export Excel
                            </a>
                        </div>
                    @endif
                </div>
                <div class="card-body !p-0">
                    <div class="overflow-x-auto !h-[400px] !max-h-[400px]">
                        <table class="table table-fixed">
                            <thead>
                                <tr class="sticky-header">
                                    <th class="text-center w-[70px]">No</th>
                                    <th class="text-center w-[100px]">Date & Time</th>
                                    <th class="text-right w-[100px]">Nilai <span class="namaParamTable"></span></th>
                                    <th class="text-left w-[250px]">Status Platform</th>
                                </tr>
                            </thead>
                            <tbody class="bodyDataTable"></tbody>
                        </table>
                    </div>
                    <div class="loaderDataTable absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                        <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                    </div>
                </div>
                <div class="card-footer footerDataTable">
                    <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[10px] py-[5px]">
                        <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div class="mr-2">
                                <p class="text-sm text-gray-700 leading-5">
                                    {!! __('Menampilkan') !!}
                                    <span class="font-medium pagiLabelFrom"></span>
                                    {!! __('s/d') !!}
                                    <span class="font-medium pagiLabelTo"></span>
                                    {!! __('dari') !!}
                                    <span class="font-medium pagiLabelTotal"></span>
                                    {!! __('Total Data') !!}
                                </p>
                            </div>
                            <div>
                                <div class="relative z-0 inline-flex shadow-sm rounded-md">
                                    <div class="pagiPrevLink inline-flex"></div>
                                    {{-- LoopLink --}}
                                    <div class="pagiLoopLink inline-flex"></div>
                                    {{-- END LoopLink --}}
                                    <div class="pagiNextLink inline-flex"></div>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>

        @include('main.be-sparing.reports.water-quality.popup.pencarian')

    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/reports/water-quality/index.tsx'])
