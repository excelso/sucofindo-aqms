@section('title', 'Data Logger')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Data Logger
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
                            <li>Data Logger</li>
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
            <div class="card z-[200]">
                <div class="card-header !pb-0 mb-4">
                    <div>
                        <div class="font-bold text-[18px]">Data</div>
                    </div>
                </div>

                <div class="card-body w-full !p-0">
                    <div class="overflow-auto min-h-[calc(100vh-22rem)]">
                        <table class="table table-fixed">
                            <thead>
                                <tr class="sticky-header">
                                    <th class="text-center w-[50px]">No.</th>
                                    <th class="text-center w-[150px]">UID</th>
                                    <th class="text-center w-[180px]">Date & Time</th>
                                    <th class="text-right w-[120px]">PM 2.5</th>
                                    <th class="text-right w-[120px]">PM 10</th>
                                    <th class="text-right w-[120px]">TSP</th>
                                    <th class="text-right w-[120px]">Noise</th>
                                    <th class="text-right w-[150px]">AQI Index</th>
                                    <th class="text-left w-[180px]">AQI Category</th>
                                    <th class="text-left w-[150px]">CCTV</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        <tr class="data-tables" data-id="{{ $item->id }}" data-uid="{{ $item->uid ?? '' }}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-center">{{ $item->uid ?? '' }}</td>
                                            <td class="text-center">{{ Carbon::parse($item->datetime_unix)->setTimezone($platform->timezone)->format('d M Y H:i:s') ?? '' }}</td>
                                            <td class="text-right">{{ $item->pm_25 ?? '' }}</td>
                                            <td class="text-right">{{ $item->pm_10 ?? '' }}</td>
                                            <td class="text-right">{{ $item->tsp ?? '' }}</td>
                                            <td class="text-right">{{ $item->noise_leq ?? '' }}</td>
                                            <td class="text-right">{{ $item->aqi_index ?? '' }}</td>
                                            <td class="text-left">
                                                <span class="status-badge inline-flex items-center rounded-full gap-1 px-[7px] py-[3px] {{ $item->color_code }} text-[12px] font-bold">
                                                    {{ mb_convert_encoding($item->emoji, 'UTF-8', 'HTML-ENTITIES') }} {{ $item->category_name_en }}
                                                </span>
                                            </td>
                                            <td class="text-left">
                                                @if($item->link_video_recorded)
                                                    <a data-href="{{ $item->link_video_recorded }}" class="btnCCTV">
                                                        <img src="{{ asset('/images/vector/icons8-cctv-100.png') }}" alt="" width="20">
                                                    </a>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                        </tr>
                                    @endforeach
                                @endif
                            </tbody>
                        </table>
                    </div>
                    @if(isset($items) && count($items) === 0)
                        <div class="not-found">
                            <div>No Data Logger Found!</div>
                        </div>
                    @endif
                </div>

                @include('components.card-footer.card-footer')
            </div>
        </div>

        {{-- Bagian Include (Modal) --}}
        @include('main.reports.data-log-parameter.popup.pencarian')
        @include('main.reports.data-log-parameter.popup.cctv')
    </div>
</x-app-layout>

@vite(['resources/js/main/reports/index.tsx'])
