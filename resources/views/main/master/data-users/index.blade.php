@section('title', 'Data Users')
<x-app-layout>
    <div class="content-main">
        <div class="content-header">
            <div class="content-title">
                <div>
                    <p class="font-bold text-[22px]">
                        Data Users
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
                            <li>Data Users</li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div class="flex flex-row items-center">
                <div class="mr-3">
                    <a class="cursor-pointer btnPencarian ml-2">
                        <i class="fas fa-search mr-2"></i> Search
                    </a>
                </div>
                <div class="mr-2">
                    <a class="btn btn-primary btnCreate ml-2">
                        <i class="fas fa-plus-circle mr-2"></i> New Users
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
                                    <th class="text-center w-[70px]">No.</th>
                                    <th class="text-left w-[250px]">Full Name</th>
                                    <th class="text-left w-[150px]">User Type</th>
                                    <th class="text-left w-[150px]">SID</th>
                                    <th class="text-left w-[250px]">Email</th>
                                    <th class="text-left w-[150px]">Role</th>
                                    <th class="text-left w-[250px]">Company Name</th>
                                    <th class="text-center w-[180px]">Last Login</th>
                                    <th data-sticky data-sticky-rw="70px" data-sticky-bp-ex="sm" class="text-right w-[130px]">Status User</th>
                                    <th data-sticky data-sticky-rw="0px" class="text-center w-[70px]">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php($i = isset($items) ? $items->firstItem() : 0)
                                @if(isset($items) && count($items) !== 0)
                                    @foreach($items as $item)
                                        <tr class="data-tables" data-id="{{ $item->id }}">
                                            <td class="text-center">{{$i++}}</td>
                                            <td class="text-left">{{ $item->nama_lengkap ?? '' }}</td>
                                            <td class="text-left">{{$item->tipe_user == '1' ? 'SSO' : 'Non SSO'}}</td>
                                            <td class="text-left">{{ $item->sid_code ?? '-' }}</td>
                                            <td class="text-left">{{ $item->email ?? '-' }}</td>
                                            <td class="text-left">
                                                @if($item->user_level === 'super_admin')
                                                    HO BC
                                                @elseif($item->user_level === 'admin')
                                                    Enviro BC Site
                                                @else
                                                    MK Enviro Site
                                                @endif
                                            </td>
                                            <td class="text-left">{{ $item->companies->company_name ?? '-' }}</td>
                                            <td class="text-center">{{ Carbon::parse($item->last_login)->timezone('Asia/Makassar')->translatedFormat('d M Y - H:i') ?? '-' }}</td>
                                            <td data-sticky data-sticky-rw="70px" data-sticky-bp-ex="sm" class="text-right">
                                                @if($item->status_user == 'Active')
                                                    <div class="ds-badge ds-badge-outline ds-badge-success text-[12px]">Active</div>
                                                @elseif($item->status_user == 'Suspend')
                                                    <div class="ds-badge ds-badge-outline ds-badge-warning text-[12px]">Suspend</div>
                                                @else
                                                    <div class="ds-badge ds-badge-outline ds-badge-error text-[12px]">Non Active</div>
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
                            <div>No Sites data found</div>
                        </div>
                    @endif
                </div>

                @include('components.card-footer.card-footer')
            </div>
        </div>

        {{-- Bagian Include (Modal) --}}
        @include('main.master.data-users.popup.form')
        @include('main.master.data-users.popup.pencarian')
    </div>
</x-app-layout>

@vite(['resources/js/main/master/data-users/index.tsx'])
