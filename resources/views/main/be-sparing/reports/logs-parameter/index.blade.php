@section('title', 'Logs Parameter')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Logs Parameter
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
                            <li>Logs Parameter</li>
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
                @if(Auth::user()->user_level != 'viewer')
                    <div class="mr-3">
                        <a class="cursor-pointer ml-2" href="{{ route('sparing.reports.logs-parameter.export-excel', [http_build_query(request()->input())]) }}" target="_blank">
                            <i class="fas fa-cloud-download mr-2"></i> Export Excel
                        </a>
                    </div>
                @endif
            </div>
        </div>

        <div class="content-body">
            <div class="card z-[200]">
                <div class="card-header !pb-0 mb-4">
                    <div>
                        <div class="font-bold text-[18px]">{{ request()->input('platformUid') ?? $dataPlatform[0]->uid }}</div>
                        <div class="text-[15px]">
                            Periode
                            @if(request()->input('interval'))
                                @if(request()->input('interval') == 1)
                                    {{ \Carbon\Carbon::parse(request()->input('tanggal'))->translatedFormat('d M Y') }}
                                @else
                                    @php($date = \Carbon\Carbon::create(request()->input('tahun'), request()->input('bulan')))
                                    {{ $date->translatedFormat('F Y') }}
                                @endif
                            @else
                                {{ request()->input('minDate') ? \Carbon\Carbon::parse(request()->input('minDate'))->translatedFormat('d M Y H:i') : \Carbon\Carbon::now()->translatedFormat('d M Y') . ' 00:00' }}
                                s/d
                                {{ request()->input('maxDate') ? \Carbon\Carbon::parse(request()->input('maxDate'))->translatedFormat('d M Y H:i') : \Carbon\Carbon::now()->translatedFormat('d M Y') . ' 23:59' }}
                            @endif
                        </div>
                    </div>
                </div>

                <div class="card-body w-full !p-0">
                    <div class="overflow-auto max-h-[calc(100vh-23rem)] min-h-[calc(100vh-23rem)]">
                        <table class="table table-fixed">
                            <thead>
                                <tr class="sticky-header">
                                    <th class="text-center w-[70px]">No.</th>
                                    <th class="text-center w-[120px]">UID</th>
                                    <th class="text-left w-[120px]">Nama WMP</th>
                                    @if(Auth::user()->user_level != 'viewer')
                                        <th class="text-left w-[120px]">Tipe Logger</th>
                                    @endif
                                    <th class="text-center w-[150px]">Date & Time</th>
                                    @if($paramAvailable->paramPh == 1)
                                        <th class="text-right w-[150px]">pH</th>
                                    @endif
                                    @if($paramAvailable->paramCod == 1)
                                        <th class="text-right w-[150px]">COD (mg/L)</th>
                                    @endif
                                    @if($paramAvailable->paramTss == 1)
                                        <th class="text-right w-[150px]">TSS (mg/L)</th>
                                    @endif
                                    @if($paramAvailable->paramNh3n == 1)
                                        <th class="text-right w-[150px]">NH3N (mg/L)</th>
                                    @endif
                                    @if($paramAvailable->paramDebit == 1)
                                        <th class="text-right w-[150px]">Debit (m<sup>3</sup>)</th>
                                    @endif
                                    <th class="text-left w-[200px]">Perusahaan</th>
                                    <th data-sticky data-sticky-rw="0px" class="text-center w-[130px]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)

                                        @php($calcDebitWarnInMinutes = $paramLimit->debit_warn ?? 0)
                                        @php($calcDebitWarnMinInMinutes = $paramLimit->debit_warn_min ?? 0)
                                        @php($calcDebitMutuMinInMinutes = $paramLimit->debit_mutu_min ?? 0)
                                        @php($calcDebitMutuInMinutes = $paramLimit->debit_mutu ?? 0)

                                        @php($dataParamStatus = [])
                                        @php($dataPhColor = '')
                                        @php($dataDebitColor = '')
                                        @php($dataCodColor = '')
                                        @php($dataTssColor = '')
                                        @php($dataNh3nColor = '')
                                        @if($paramAvailable->paramPh == 1)
                                            @if(($item->ph > $paramLimit->ph_mutu_min && $item->ph <= $paramLimit->ph_warn_min) || ($item->ph >= $paramLimit->ph_warn_max && $item->ph < $paramLimit->ph_mutu_max))
                                                @php($dataParamStatus[] = ['val' => 2])
                                                @php($dataPhColor = 'text-yellow-400')
                                            @elseif($item->ph >= $paramLimit->ph_mutu_max || ($item->ph <= $paramLimit->ph_mutu_min && $paramLimit->ph_intermit == 0))
                                                @php($dataParamStatus[] = ['val' => 3])
                                                @php($dataPhColor = 'text-red-400')
                                            @else
                                                @php($dataParamStatus[] = ['val' => 1])
                                                @php($dataPhColor = 'text-green-400')
                                            @endif
                                        @endif

                                        @if($paramAvailable->paramDebit == 1)
                                            @if($item->debit > $calcDebitWarnInMinutes && $item->debit <= $calcDebitWarnMinInMinutes || $item->debit >= $calcDebitMutuMinInMinutes && $item->debit < $calcDebitMutuInMinutes)
                                                @php($dataParamStatus[] = ['val' => 2])
                                                @php($dataDebitColor = 'text-yellow-400')
                                            @elseif($item->debit >= $calcDebitMutuInMinutes || ($item->debit <= $calcDebitWarnInMinutes && $item->debit_intermit == 0))
                                                @php($dataParamStatus[] = ['val' => 3])
                                                @php($dataDebitColor = 'text-red-400')
                                            @else
                                                @php($dataParamStatus[] = ['val' => 1])
                                                @php($dataDebitColor = 'text-green-400')
                                            @endif
                                        @endif

                                        @if($paramAvailable->paramCod == 1)
                                            @if($item->cod >= $paramLimit->cod_warn && $item->cod <= $paramLimit->cod_mutu)
                                                @php($dataParamStatus[] = ['val' => 2])
                                            @elseif($item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit == 0))
                                                @php($dataParamStatus[] = ['val' => 3])
                                            @else
                                                @php($dataParamStatus[] = ['val' => 1])
                                            @endif
                                        @endif

                                        @if($paramAvailable->paramTss == 1)
                                            @if($item->tss > $paramLimit->tss_warn && $item->tss <= $paramLimit->tss_warn_min || $item->tss >= $paramLimit->tss_mutu_min && $item->tss < $paramLimit->tss_mutu)
                                                @php($dataParamStatus[] = ['val' => 2])
                                                @php($dataTssColor = 'text-yellow-400')
                                            @elseif($item->tss >= $paramLimit->tss_mutu || ($item->tss <= $paramLimit->tss_warn && $paramLimit->tss_intermit == 0))
                                                @php($dataParamStatus[] = ['val' => 3])
                                                @php($dataTssColor = 'text-red-400')
                                            @else
                                                @php($dataParamStatus[] = ['val' => 1])
                                                @php($dataTssColor = 'text-green-400')
                                            @endif
                                        @endif

                                        @if($paramAvailable->paramNh3n == 1)
                                            @if($item->nh3n >= $paramLimit->nh3n_warn && $item->nh3n <= $paramLimit->nh3n_mutu)
                                                @php($dataParamStatus[] = ['val' => 2])
                                            @elseif($item->nh3n > $paramLimit->nh3n_mutu || ($item->nh3n <= 0 && $paramLimit->nh3n_intermit == 0))
                                                @php($dataParamStatus[] = ['val' => 3])
                                            @else
                                                @php($dataParamStatus[] = ['val' => 1])
                                            @endif
                                        @endif

                                        @php($maxStatus = 0)
                                        @foreach($dataParamStatus as $itemStatus)
                                            @if($itemStatus['val'] > $maxStatus)
                                                @php($maxStatus = $itemStatus['val'])
                                            @endif
                                        @endforeach

                                        @php($status = 'Normal')
                                        @php($statusClassBadge = 'ds-badge ds-badge-success')
                                        @if($maxStatus == 2)
                                            @php($status = 'Warning')
                                            @php($statusClassBadge = 'ds-badge ds-badge-warning')
                                        @elseif($maxStatus == 3)
                                            @php($status = 'Danger')
                                            @php($statusClassBadge = 'ds-badge ds-badge-error')
                                        @endif

                                        @php($tipeLogger = 'Internal')
                                        @if($item->tipe_logger == 2)
                                            @php($tipeLogger = 'KLHK')
                                        @endif

                                        <tr class="data-tables" data-id="{{ $item->id }}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-center">{{ $item->uid }}</td>
                                            <td class="text-left">{{ $item->platform->site->nama_site }}</td>
                                            @if(Auth::user()->user_level != 'viewer')
                                                <td class="text-left">{{ $tipeLogger }}</td>
                                            @endif
                                            <td class="text-center">{{ $item->datetime_formatted }}</td>
                                            @if($paramAvailable->paramPh == 1)
                                                <td class="text-right {{ $dataPhColor }}">{{ number_format($item->ph, 2) }}</td>
                                            @endif
                                            @if($paramAvailable->paramCod == 1)
                                                <td class="text-right">{{ number_format($item->cod, 2) }}</td>
                                            @endif
                                            @if($paramAvailable->paramTss == 1)
                                                <td class="text-right {{ $dataTssColor }}">{{ number_format($item->tss) }}</td>
                                            @endif
                                            @if($paramAvailable->paramNh3n == 1)
                                                <td class="text-right">{{ number_format($item->nh3n, 2) }}</td>
                                            @endif
                                            @if($paramAvailable->paramDebit == 1)
                                                <td class="text-right {{ $dataDebitColor }}">{{ sprintf('%.2f', floor($item->debit * 100) / 100) }}</td>
                                            @endif
                                            <td class="text-left">{{ $item->platform->site->customer->nama_perusahaan }}</td>
                                            <td data-sticky data-sticky-rw="0px" class="text-center">
                                                <span class="ds-badge-outline {{ $statusClassBadge }} !text-[12px]">{{ $status }}</span>
                                            </td>
                                        </tr>
                                    @endforeach
                                @endif
                            </tbody>
                        </table>
                    </div>
                    @if(isset($items) && count($items) == 0)
                        <div class="not-found">
                            <div>Data Logs tidak ditemukan</div>
                        </div>
                    @endif
                </div>

                @if(isset($items) && count($items) !== 0)
                    <div class="card-footer">
                        @if($items->hasPages())
                            {{$items->withQueryString()->links('pagination::tailwind')}}
                        @else
                            <div class="px-[10px] py-[5px] mr-2 text-sm text-gray-700">
                                Menampilkan {{$items->firstItem()}} s/d {{$items->lastItem()}} dari {{$items->total()}} Total Data
                            </div>
                        @endif
                    </div>
                @endif
            </div>
        </div>

        @include('main.be-sparing.reports.logs-parameter.popup.pencarian')

    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/reports/logs-parameter/index.tsx'])
