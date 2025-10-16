@section('title', 'Data Summary')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title !items-start">
                <div class="mr-4">
                    <a href="{{ route('sparing.dashboard.maps') }}" class="mt-2 !text-[24px]">
                        <i class="fas fa-arrow-circle-left"></i>
                    </a>
                </div>
                <div>
                    <div class="font-bold text-[22px]">
                        <div class="titlePerusahaan">
                            <div class="skeleton-box w-[175px] !h-[20px] rounded-full"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center">
                            <div class="titleUid text-sm">
                                <div class="skeleton-box w-[300px] !h-[20px] rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex items-center mt-1">
                            <div class="statusOnlinePlatform mr-2">
                                <div class="skeleton-box w-[100px] !h-[20px] rounded-full"></div>
                            </div>
                            <div class="statusPowerPlatform btnPower cursor-pointer mr-2">
                                <div class="skeleton-box w-[100px] !h-[20px] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-row items-center">
                <div class="ml-2">
                    <input type="hidden" class="userLevel" value="{{ Auth::user()->user_level }}">
                    <div class="form-group">
                        <div class="form-group-control bg-white w-[320px]">
                            <select class="form-control select2-custom platformUid">
                                @foreach($dataPlatform as $item)
                                    @php($selected = request()->segment(5) == $item->uid && request()->segment(6) == $item->tipe_logger ? 'selected' : '')
                                    @if(Auth::user()->user_level != 'viewer')
                                        <option value="{{ $item->uid }}" data-status="{{ $item->status_platform }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site }} / {{ $item->site->customerLokasi->nama_lokasi }} / {{ $item->tipe_logger == 1 ? 'Internal' : 'KLHK' }}" {{ $selected }}>{{ $item->uid }}</option>
                                    @else
                                        <option value="{{ $item->uid }}" data-status="{{ $item->status_platform }}" data-tipe-logger="{{ $item->tipe_logger }}" data-additional="{{ $item->site->nama_site }} / {{ $item->site->customerLokasi->nama_lokasi }}" {{ $selected }}>{{ $item->uid }}</option>
                                    @endif
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>
                <div class="ml-2 !hidden">
                    <button id="dropdownMenuIconButton" data-dropdown-toggle="dropdownTable" data-dropdown-offset-skidding="-80">
                        <i class="fas fa-ellipsis-v text-[26px] px-2"></i>
                    </button>
                    <div id="dropdownTable" class="dropdown-panel w-[200px] z-[999]">
                        <ul aria-labelledby="dropdownButton">
                            <li class="exportTable">
                                <a class="btnLihatDokumen cursor-pointer">
                                    <i class="fas fa-file mr-2"></i> Lihat Dokumen
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-body">
            <div class="tipe4">
                @include('main.be-sparing.dashboard.maps.summary.infobox.tipe4')
            </div>

            <div class="mt-2">
                <input type="hidden" class="platformUidSelected" value="{{ $platformUid }}">
                <input type="hidden" class="tipeLoggerSelected" value="{{ $tipeLogger }}">
                <input type="hidden" class="parameterIdSelected" value="pH">
                <input type="hidden" class="timezone" value="{{ $timezone }}">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="card">
                            <div class="card-header border-b">
                                <div class="w-[50%]">
                                    <div class="font-bold text-[18px]">Hasil Ukur</div>
                                    <div class="text-[15px] titlePeriodeCardChart">
                                        Periode {{ \Carbon\Carbon::now()->timezone($timezone)->translatedFormat('l, d F Y') }}
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <div class="flex items-center cursor-pointer mr-4 btnTemperature">
                                        <div class="leading-[10px] text-[14px]">Temp:
                                            <span class="nilaiTemperature">0</span>°C
                                        </div>
                                        <i class="fas fa-temperature-half !text-[20px] iconTemperature ml-2"></i>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-group-control w-[100px]">
                                            <select class="form-control select2-custom parameterId">
                                                @foreach($parseParameter as $item)
                                                    <option value="{{ $item }}">{{ $item }}</option>
                                                @endforeach
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="grid grid-cols-3 gap-4 mt-5 mb-10">
                                    <div class="col-span-1">
                                        <div class="flex items-center justify-center">
                                            <div class="radial-progress primary !w-[75px] !h-[75px] text-[12px] progressDataMasuk">
                                                <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                            </div>
                                            <div class="ml-2">
                                                <div class="text-[12px]">Total Masuk</div>
                                                <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMasuk">
                                                    <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div class="flex items-center justify-center">
                                            <div class="radial-progress success !w-[75px] !h-[75px] text-[12px] progressDataMutu">
                                                <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                            </div>
                                            <div class="ml-2">
                                                <div class="text-[12px]">Data Sesuai</div>
                                                <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMutu">
                                                    <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div class="flex items-center justify-center">
                                            <div class="radial-progress danger !w-[75px] !h-[75px] text-[12px] progressDataTidakMutu">
                                                <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                            </div>
                                            <div class="ml-2">
                                                <div class="text-[12px]">Tidak Sesuai</div>
                                                <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataTidakMutu">
                                                    <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bodyChart !h-[425px]"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="card">
                            <div class="card-header border-b">
                                <div class="w-[50%]">
                                    <div class="font-bold text-[18px]">Hasil Ukur</div>
                                    <div class="text-[15px] titlePeriodeCardChart">
                                        Periode {{ \Carbon\Carbon::now()->timezone($timezone)->translatedFormat('l, d F Y') }}
                                    </div>
                                </div>
                                <div>
                                    <div class="form-group">
                                        <label class="form-group-control w-[150px]">
                                            <select class="form-control select2-custom statusPlatform">
                                                <option value="">Semua Status</option>
                                                <option value="1">Normal</option>
                                                <option value="2">Warning</option>
                                                <option value="3">Danger</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body relative !p-0">
                                <div class="overflow-x-auto !h-[535px] !max-h-[550px]">
                                    <table class="table table-fixed">
                                        <thead>
                                            <tr class="sticky-header">
                                                <th class="text-center w-[100px]">Time</th>
                                                <th class="text-right w-[120px] thPh">pH</th>
                                                <th class="text-right w-[120px] thCod">COD (mg/L)</th>
                                                <th class="text-right w-[120px] thTss">TSS (mg/L)</th>
                                                <th class="text-right w-[120px] thNh3n">NH3N (mg/L)</th>
                                                <th class="text-right w-[120px] thDebit">Debit (m<sup>3</sup>)</th>
                                                <th data-sticky data-sticky-rw="0px" class="text-center w-[130px]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bodyDataTable"></tbody>
                                    </table>
                                </div>
                                <div class="noDataTable absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9] hidden">
                                    <i class="fas fa-exclamation-circle mr-2"></i> Tidak ada data ditemukan!
                                </div>
                                <div class="loaderDataTable absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] px-10 py-7 rounded-md text-white bg-[rgba(0,0,0,0.3)] z-[9]">
                                    <i class="fas fa-spinner fa-pulse mr-2"></i> Mohon Tunggu...
                                </div>
                            </div>
                            <div class="card-footer footerDataTable !p-0 h-[65px]">
                                <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[15px]">
                                    <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div class="mr-2 sm:hidden">
                                            <p class="text-sm text-gray-700 leading-5">
                                                <span class="font-medium pagiLabelFrom hidden"></span>
                                                <span class="font-medium pagiLabelTo hidden"></span>
                                                {!! __('Total') !!}
                                                <span class="font-medium pagiLabelTotal"></span>
                                                {!! __('Data') !!}
                                            </p>
                                        </div>
                                        <div class="ml-auto">
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
                </div>
            </div>
        </div>

        @include('main.be-sparing.dashboard.maps.summary.popup.temperature')
        @include('main.be-sparing.dashboard.maps.summary.popup.power')
        @include('main.be-sparing.dashboard.maps.summary.popup.dokumen')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/dashboard/maps/summary/index.tsx'])
