@section('title', 'Data Location')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Data Location
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
                            <li>Data Location</li>
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
                        <i class="fas fa-plus-circle mr-2"></i> New Location
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
                                    <th class="text-left w-[150px]">Location Name</th>
                                    <th class="text-left w-[150px]">Site Name</th>
                                    <th class="text-left w-[150px]">Company Name</th>
                                    <th class="text-center w-[130px]">Update Date</th>
                                    <th class="text-center w-[50px]">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        <tr class="data-tables" data-id="{{ $item->id }}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-left">{{ $item->location_name }}</td>
                                            <td class="text-left">{{ $item->sites->site_name }}</td>
                                            <td class="text-left">{{ $item->sites->companies->company_name }}</td>
                                            <td class="text-center">{{ Carbon::parse($item->updated_at)->translatedFormat('d M Y H:i') }}</td>
                                            <td class="text-center">
                                                <a href="javascript:void(0)" class="btnEdit">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                            </td>
                                        </tr>
                                    @endforeach
                                @endif
                            </tbody>
                        </table>
                    </div>
                    @if(isset($items) && count($items) === 0)
                        <div class="not-found">
                            <div>No Sites data found</div>
                        </div>
                    @endif
                </div>

                @include('components.card-footer.card-footer')
            </div>
        </div>

        {{-- Bagian Include (Modal) --}}
        @include('main.master.data-sites-location.popup.form')
        @include('main.master.data-sites-location.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/master/data-sites-location/index.tsx'])
