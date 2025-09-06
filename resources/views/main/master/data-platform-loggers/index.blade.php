@section('title', 'Data Platform Loggers')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Data Platform Loggers
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
                            <li>Master</li>
                            <li>Data Platform Loggers</li>
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
                    <a class="btn btn-primary btnCreate ml-2">
                        <i class="fas fa-plus-circle mr-2"></i> New Platform
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
                                    <th class="text-center w-[150px]">Platform Name</th>
                                    <th class="text-left w-[150px]">Camera 1 (RTC)</th>
                                    <th class="text-left w-[150px]">Camera 2 (RTC)</th>
                                    <th class="text-left w-[150px]">CCTV Link (HLS)</th>
                                    <th class="text-left w-[150px]">Timezone</th>
                                    <th class="text-left w-[150px]">Location Name</th>
                                    <th class="text-left w-[150px]">Site Name</th>
                                    <th class="text-left w-[150px]">Company Name</th>
                                    <th class="text-center w-[130px]">Update Date</th>
                                    <th data-sticky data-sticky-rw="0px" class="text-center w-[70px]">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        <tr class="data-tables" data-id="{{ $item->id }}" data-uid="{{ $item->uid ?? '' }}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-center">{{ $item->uid ?? '' }}</td>
                                            <td class="text-center">{{ $item->uid_alias ?? '' }}</td>
                                            <td class="text-left">
                                                @if($item->cctv_link_1)
                                                    <a class="cursor-pointer btnCamera1" data-href="{{ $item->cctv_link_1 }}" data-ptz="{{ $item->cctv_1_support_ptz ?? '0' }}">
                                                        {{ $item->cctv_link_1 }}
                                                    </a>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                            <td class="text-left">
                                                @if($item->cctv_link_2)
                                                    <a class="cursor-pointer btnCamera2" data-href="{{ $item->cctv_link_2 }}" data-ptz="{{ $item->cctv_2_support_ptz ?? '0' }}">
                                                        {{ $item->cctv_link_2 }}
                                                    </a>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                            <td class="text-left">
                                                @if($item->cctv_link_hls)
                                                    <a class="cursor-pointer btnCCTVHls" data-href="{{ $item->cctv_link_hls }}">
                                                        {{ $item->cctv_link_hls }}
                                                    </a>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                            <td class="text-left">{{ $item->timezone ?? '-' }}</td>
                                            <td class="text-left">{{ $item->sitesLocation->location_name ?? '-' }}</td>
                                            <td class="text-left">{{ $item->sitesLocation->sites->site_name ?? '-' }}</td>
                                            <td class="text-left">{{ $item->sitesLocation->sites->companies->company_name ?? '-' }}</td>
                                            <td class="text-center">{{ Carbon::parse($item->updated_at)->translatedFormat('d M Y H:i') }}</td>
                                            <td data-sticky data-sticky-rw="0px" class="text-center">
                                                <button class="focus:outline-none dropdownPlatform p-2" data-id="row{{ $i }}">
                                                    <i class="fas fa-ellipsis-vertical text-[18px]"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    @endforeach
                                @endif
                            </tbody>
                        </table>
                    </div>
                    @if(isset($items) && count($items) === 0)
                        <div class="not-found">
                            <div>No Platform data found</div>
                        </div>
                    @endif
                </div>

                @include('components.card-footer.card-footer')
            </div>
        </div>

        {{-- Bagian Include (Modal) --}}
        @include('main.master.data-platform-loggers.popup.form')
        @include('main.master.data-platform-loggers.popup.cctv')
    </div>
</x-app-layout>

@vite(['resources/js/main/master/data-platform-loggers/index.tsx'])
