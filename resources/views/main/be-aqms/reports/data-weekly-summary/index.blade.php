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
                    <a class="cursor-pointer btnSearch ml-2">
                        <i class="fas fa-search mr-2"></i> Search
                    </a>
                </div>
                <div class="mr-2">
                    <a class="cursor-pointer ml-2" href="{{ route('aqms.reports.weekly-summary.export-excel', [http_build_query(request()->input())]) }}" target="_blank">
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
                                    <th class="text-center w-[70px]">No.</th>
                                    <th class="text-center w-[150px]">UID</th>
                                    <th class="text-left w-[150px]">Site</th>
                                    <th class="text-left w-[150px]">Location Name</th>
                                    <th class="text-right w-[180px]">% Data Masuk</th>
                                    <th class="text-right w-[180px]">% Connectivity</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        <tr class="data-tables" data-items="{{json_encode($item)}}">
                                            <td class="text-center">{{ $i++ }}</td>
                                            <td class="text-center">{{ $item->uid }}</td>
                                            <td class="text-left">{{ $item->sitesLocation->sites->site_name ?? '-' }}</td>
                                            <td class="text-left">{{ $item->sitesLocation->location_name ?? '-' }}</td>
                                            <td class="text-right">{{ round($item->data_entry, 2) ?? '-' }}%</td>
                                            <td class="text-right">{{ round($item->data_connectivity, 2) ?? '-' }}%</td>
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

                @include('components.card-footer.card-footer')
            </div>
        </div>

        @include('main.be-aqms.reports.data-weekly-summary.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/be-aqms/reports/data-weekly-summary/index.tsx'])
