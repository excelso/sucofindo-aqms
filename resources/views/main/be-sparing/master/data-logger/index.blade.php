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
                            <li>Master</li>
                            <li>Data Logger</li>
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
                    <a class="btn btn-primary btnTambah ml-2">
                        <i class="fas fa-plus-circle mr-2"></i> Tambah Logger
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
                                    <th class="text-center w-[100px]">No.</th>
                                    <th class="text-left w-[180px]">UID</th>
                                    <th class="text-left w-[180px]">Nama WMP</th>
                                    <th class="text-left w-[180px]">Nama Site / Lokasi</th>
                                    <th class="text-left w-[180px]">Tipe Logger</th>
                                    <th class="text-left w-[180px]">Catchment Area</th>
                                    <th class="text-left w-[180px]">Badan Air</th>
                                    <th class="text-left w-[180px]">Jenis Industri</th>
                                    <th class="text-left w-[180px]">Timezone</th>
                                    <th class="text-left w-[180px]">Nomor GSM</th>
                                    <th class="text-left w-[180px]">Tanggal Isi Modem</th>
                                    <th data-sticky data-sticky-rw="250px" data-sticky-bp-ex="sm" class="text-right w-[180px]">Total Parameter</th>
                                    <th data-sticky data-sticky-rw="100px" data-sticky-bp-ex="sm" class="text-right w-[150px]">Status</th>
                                    <th data-sticky data-sticky-rw="0px" class="text-center w-[100px]">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        @php($totalParam = isset($item->site->customer) ? count(json_decode($item->site->customer->jenisIndustri->parameter, true)) : 0)
                                        @php($tipeLogger = 'Internal')
                                        @if($item->tipe_logger == 2)
                                            @php($tipeLogger = 'KLHK')
                                        @endif

                                        <tr class="data-tables" data-items="{{json_encode($item)}}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-left">{{ $item->uid }}</td>
                                            <td class="text-left">{{ $item->site->nama_site ?? '-' }}</td>
                                            <td class="text-left">{{ $item->site->customerLokasi->nama_lokasi ?? '-' }}</td>
                                            <td class="text-left">{{ $tipeLogger }}</td>
                                            <td class="text-left">{{ $item->catchment_area ?? '-' }}</td>
                                            <td class="text-left">{{ $item->badan_air ?? '-' }}</td>
                                            <td class="text-left">{{ $item->site->customer->jenisIndustri->jenis_industri ?? '-' }}</td>
                                            <td class="text-left">{{ \App\Http\Helper\Common::getNearestTimezone($item->lat, $item->lng, 'ID') }}</td>
                                            <td class="text-left">{{ $item->nomor_gsm_modem ?? '-' }}</td>
                                            <td class="text-left">{{ $item->tanggal_pengisian_modem != null ? \Carbon\Carbon::parse($item->tanggal_pengisian_modem)->translatedFormat('d M Y') : '-' }}</td>
                                            <td data-sticky data-sticky-rw="250px" data-sticky-bp-ex="sm" class="text-right">
                                                <span class="ds-badge ds-badge-outline ds-badge-info !text-[12px]">
                                                    {{ $totalParam }} Parameter
                                                </span>
                                            </td>
                                            <td data-sticky data-sticky-rw="100px" data-sticky-bp-ex="sm" class="text-right">
                                                @if($item->status_validasi == 'Active')
                                                    <span class="ds-badge ds-badge-success ds-badge-outline !text-[12px]">Active</span>
                                                @elseif($item->status_validasi == 'Pending')
                                                    <span class="ds-badge ds-badge-warning ds-badge-outline !text-[12px]">Wait Validation</span>
                                                @elseif($item->status_validasi == 'Suspend')
                                                    <span class="ds-badge ds-badge-error ds-badge-outline !text-[12px]">Suspend</span>
                                                @endif
                                            </td>
                                            <td data-sticky data-sticky-rw="0px" class="text-center">
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

        @include('main.be-sparing.master.data-logger.popup.pencarian')
        @include('main.be-sparing.master.data-logger.popup.form')
        @include('main.be-sparing.master.data-logger.popup.form-maps')
        @include('main.be-sparing.master.data-logger.popup.upload-dokumen')

    </div>
</x-app-layout>

@vite(['resources/js/main/be-sparing/master/data-logger/index.tsx'])
