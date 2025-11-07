@section('title', 'Weekly Summary')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Weekly Summary
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
                            <li>Weekly Summary</li>
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
                <div class="mr-2">
                    <a class="cursor-pointer ml-2" href="{{ route('sparing.reports.weekly-summary.export-excel', [http_build_query(request()->input())]) }}" target="_blank">
                        <i class="fas fa-cloud-download mr-2"></i> Export Excel
                    </a>
                </div>
            </div>
        </div>

        <div class="content-body">
            <div class="card z-[200]">
                <div class="card-header !pb-0 mb-4">
                    <div>
                        <div class="font-bold text-[18px]">
                            <div>{{ $weekNumb }}</div>
                            <div class="text-[13px] font-normal">{{ $weekInfo['startDateFormatted'] }} - {{ $weekInfo['untilDateFormatted'] }}</div>
                        </div>
                    </div>
                </div>

                <div class="card-body w-full !p-0">
                    <div class="overflow-auto min-h-[calc(100vh-22rem)]">
                        <table class="table table-fixed">
                            <thead>
                                <tr class="sticky-header">
                                    <th rowspan="2" class="text-center w-[100px] !py-[9px]">No.</th>
                                    <th rowspan="2" class="text-left w-[180px] !py-[9px]">UID</th>
                                    <th rowspan="2" class="text-left w-[180px] !py-[9px]">Tipe Logger</th>
                                    <th rowspan="2" class="text-right w-[180px] !py-[9px]">Data Entry</th>
                                    <th colspan="3" class="text-center border-l !py-[9px]">Checkpoint Comply</th>
                                </tr>
                                <tr class="sticky-header">
                                    <th class="text-right w-[180px] !py-[9px]">pH</th>
                                    <th class="text-right w-[180px] !py-[9px]">TSS</th>
                                    <th class="text-right w-[180px] !py-[9px]">Debit</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        @php($tipeLogger = 'Internal')
                                        @if($item->tipe_logger == 2)
                                            @php($tipeLogger = 'KLHK')
                                        @endif

                                        <tr class="data-tables" data-items="{{json_encode($item)}}">
                                            <td class="text-center">{{ $i++ }}</td>
                                            <td class="text-left">{{ $item->uid }}</td>
                                            <td class="text-left">{{ $tipeLogger }}</td>
                                            <td class="text-right">{{ round($item->persen, 2) ?? '-' }}%</td>
                                            <td class="text-right">{{ round($item->percentagePh, 2) ?? '-' }}%</td>
                                            <td class="text-right">{{ round($item->percentageTss, 2) ?? '-' }}%</td>
                                            <td class="text-right">{{ round($item->percentageDebit, 2) ?? '-' }}%</td>
                                        </tr>
                                    @endforeach
                                @endif
                            </tbody>
                        </table>
                    </div>
                    @if(isset($items) && count($items) === 0)
                        <div class="not-found">
                            <div>Data Logger tidak ditemukan</div>
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

        @include('main.be-sparing.reports.weekly-summary.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/reports/weekly-summary/index.tsx'])
