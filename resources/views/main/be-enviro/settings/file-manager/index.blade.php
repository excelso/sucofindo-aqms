@section('title', 'File Manager')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        File Manager
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
                            <li>Settings</li>
                            <li>File Manager</li>
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
            <div class="grid grid-cols-4 gap-4">

                <div class="col-span-1">
                    <div class="card z-[200]">
                        <div class="card-header border-b">
                            <div>
                                <div class="font-bold text-[18px]">Storage</div>
                            </div>
                        </div>
                        <div class="card-body w-full">
                            @foreach($diskInfo as $item)
                                <div>
                                    <div class="flex justify-between gap-5 mb-1 font-bold text-[14px]">
                                        <div class="truncate">{{ $item->server_name ?? '' }}</div>
                                        <div>{{ $item->server_ip ?? '' }}</div>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full">
                                        <div class="{{ $item->disk_used_percent ? $item->disk_used_percent < 80 ? 'bg-blue-500' : 'bg-red-500' : '' }} text-xs font-medium text-white text-center p-0.5 leading-none rounded-full h-4 flex items-center justify-center" style="width: {{ $item->disk_used_percent ?? 0 }}%">

                                        </div>
                                    </div>
                                    <div class="mt-3 text-[14px]">
                                        <div class="flex justify-between mt-2">
                                            <div>Disk Total</div>
                                            <div>{{ \App\Http\Helper\Common::formatBytes($item->disk_total ?? 0) }}</div>
                                        </div>
                                        <div class="flex justify-between mt-2">
                                            <div>Free</div>
                                            <div>{{ \App\Http\Helper\Common::formatBytes($item->disk_free ?? 0) }}</div>
                                        </div>
                                        <div class="flex justify-between mt-2">
                                            <div>Used</div>
                                            <div>{{ $item->disk_used_percent ? $item->disk_used_percent . '%' : '' }} - {{ \App\Http\Helper\Common::formatBytes($item->disk_used ?? 0) }}</div>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>

                <div class="col-span-3">
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
                                            <th class="text-center w-[70px]">No.</th>
                                            <th class="text-left w-[350px]">File Name</th>
                                            <th class="text-left w-[150px]">Platform</th>
                                            <th class="text-center w-[150px]">Created Date</th>
                                            <th class="text-center w-[100px]">#</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @php($i = isset($items) ? $items->firstItem() : 0)
                                        @foreach($items as $item)
                                            @php($components = parse_url($item->link_video_recorded))
                                            @php($filename = explode('/', $components['path'] ?? ''))
                                            <tr>
                                                <td class="text-center">{{ $i++ }}</td>
                                                <td class="text-left">{{ $filename[2] ?? '' }}</td>
                                                <td class="text-left">AQMS</td>
                                                <td class="text-center">{{ \Carbon\Carbon::parse($item->created_at)->translatedFormat('d F Y') }}</td>
                                                <td class="text-center">
                                                    <a class="btnDelete">
                                                        <i class="fas fa-trash-can"></i>
                                                    </a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        @include('components.card-footer.card-footer')
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

@vite(['resources/js/main/be-enviro/settings/change-password/index.tsx'])
