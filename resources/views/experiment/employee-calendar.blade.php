@vite(['resources/css/app.scss', 'resources/js/experiment/testing-employee-calendar.tsx'])

<div class="flex mb-5">
    <div class="btnPrev">Prev</div>
    <div class="btnNext">Next</div>
</div>
<table id="table1" class="table border">
    <thead>
        <tr>
            <th class="text-left">Nama Karyawan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($dataKaryawan as $item)
            <tr data-employee-id="{{ $item->id }}">
                <td class="text-left">{{ $item->nama_karyawan ?? '-' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
