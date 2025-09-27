<div class="hidden p-5 rounded-lg" id="setting">
    <div class="grid grid-cols-3 gap-4">
        <div class="col-span-1">
            <div class="form-group">
                <label>Nama Perusahaan</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom customerId" data-selected="1" disabled>
                        @if(isset($customer))
                            @foreach($customer as $item)
                                <option value="{{ $item->id }}" data-param="{{ $item->jenisIndustri->parameter }}">{{ $item->nama_perusahaan }}</option>
                            @endforeach
                        @endif
                    </select>
                </div>
                <ul class="customerIdError"></ul>
            </div>
            <div class="form-group">
                <label>Nama Site / Lokasi</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom customerLokasiId">
                        <option value="">...</option>
                    </select>
                </div>
                <ul class="customerLokasiIdError"></ul>
            </div>
            <div class="form-group">
                <label>Nama WMP</label>
                <div class="form-group-control">
                    <input type="hidden" class="siteIdOld">
                    <select class="form-select select2-custom siteId">
                        <option value="">...</option>
                    </select>
                </div>
                <ul class="siteIdError"></ul>
            </div>
            <div class="form-group">
                <label>Tipe Logger</label>
                <div class="form-group-control">
                    <select class="form-select select2-custom tipeLogger">
                        <option value="">...</option>
                        <option value="1">Internal</option>
                        <option value="2">KLHK</option>
                    </select>
                </div>
                <ul class="tipeLoggerError"></ul>
            </div>
            <div class="form-group">
                <label>UID</label>
                <label class="form-group-control relative">
                    <input type="hidden" class="platformUidOld">
                    <input class="form-control platformUid" placeholder="...">
                    <a class="flex text-[12px] mr-2">
                        Auto
                    </a>
                </label>
                <div class="info-alert-text !text-[12px]">
                    <div><i class="fas fa-info-circle mr-1"></i></div>
                    <div>Ubah UID pada Platform/Logger terlebih dahulu jika Anda akan mengubah UID pada aplikasi</div>
                </div>
                <ul class="platformUidError"></ul>
            </div>
            <div class="form-group">
                <label>Catchment Area</label>
                <label class="form-group-control">
                    <input class="form-control catchmentArea" placeholder="...">
                </label>
                <ul class="catchmentAreaError"></ul>
            </div>
            <div class="form-group">
                <label>Badan Air</label>
                <label class="form-group-control">
                    <input class="form-control badanAir" placeholder="...">
                </label>
                <ul class="badanAirError"></ul>
            </div>
            <div class="form-group">
                <label>Serial Number</label>
                <label class="form-group-control">
                    <input class="form-control serialNumber" placeholder="...">
                </label>
                <ul class="serialNumberError"></ul>
            </div>
            <div class="form-group">
                <label>Lokasi Platform</label>
                <label class="form-group-control relative">
                    <input class="form-control lokasiPlatform" placeholder="...">
                    <a class="flex text-[12px] mr-2 btnLihatMaps">
                        Ubah
                    </a>
                </label>
                <ul class="lokasiPlatformError"></ul>
            </div>
            <div class="form-group">
                <label>Alamat Lokasi Platform</label>
                <label class="form-group-control relative">
                    <textarea class="form-control alamatLokasiPlatform" rows="4" placeholder="..."></textarea>
                </label>
                <ul class="alamatLokasiPlatformError"></ul>
            </div>
            <div class="form-group">
                <label>No. Modem</label>
                <label class="form-group-control">
                    <input class="form-control nomorModem number-handphone" placeholder="...">
                </label>
                <div class="info-alert-text !text-[12px]">
                    <div><i class="fas fa-info-circle mr-1"></i></div>
                    <div>Nomor GSM pada Modem</div>
                </div>
                <ul class="nomorModemError"></ul>
            </div>
            <div class="form-group">
                <label>Tanggal Isi Modem</label>
                <label class="form-group-control">
                    <input class="form-control tanggalIsiModem datepicker" placeholder="...">
                </label>
                <div class="info-alert-text !text-[12px]">
                    <div><i class="fas fa-info-circle mr-1"></i></div>
                    <div>Tanggal terakhir pengisian pulsa Modem</div>
                </div>
                <ul class="tanggalIsiModemError"></ul>
            </div>
        </div>
        <div class="col-span-2">
            <div class="flex items-center mb-10">
                <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                <div class="">
                    <div class="text-[17px] font-bold">Konfigurasi Sensor</div>
                    <div class="text-[12px] text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i> Pengaturan nilai Baku Mutu pada sensor Platform/Logger
                    </div>
                </div>
            </div>

            <div class="mb-7 formParamPh hidden">
                <div class="flex items-center mb-5">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter pH</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                Low Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number phMutuMin">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas bawah</div>
                            </div>
                            <ul class="phMutuMinError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                Low Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number phWarnMin">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas bawah</div>
                            </div>
                            <ul class="phWarnMinError"></ul>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                High Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number phMutuMax">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas atas</div>
                            </div>
                            <ul class="phMutuMaxError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                High Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number phWarnMax">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas atas</div>
                            </div>
                            <ul class="phWarnMaxError"></ul>
                        </div>
                    </div>
                </div>
                <div class="flex">
                    <label>
                        <input type="checkbox" class="intermitPh">
                    </label>
                    <div class="ml-2 leading-[28px]">Intermittent?</div>
                </div>
            </div>

            <div class="mb-7 formParamCod hidden">
                <div class="flex items-center mb-5">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter COD</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                Low Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number codLowMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas bawah</div>
                            </div>
                            <ul class="codLowMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                Low Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number codLowWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas bawah</div>
                            </div>
                            <ul class="codLowWarnError"></ul>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                High Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number codHighMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas atas</div>
                            </div>
                            <ul class="codHighMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                High Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number codHighWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas atas</div>
                            </div>
                            <ul class="codHighWarnError"></ul>
                        </div>
                    </div>
                </div>
                <div class="flex">
                    <label>
                        <input type="checkbox" class="intermitCod">
                    </label>
                    <div class="ml-2 leading-[28px]">Intermittent?</div>
                </div>
            </div>

            <div class="mb-7 formParamTss hidden">
                <div class="flex items-center mb-5">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter TSS</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                Low Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number tssLowMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas bawah</div>
                            </div>
                            <ul class="tssLowMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                Low Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number tssLowWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas bawah</div>
                            </div>
                            <ul class="tssLowWarnError"></ul>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                High Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number tssHighMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas atas</div>
                            </div>
                            <ul class="tssHighMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                High Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number tssHighWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas atas</div>
                            </div>
                            <ul class="tssHighWarnError"></ul>
                        </div>
                    </div>
                </div>
                <div class="flex">
                    <label>
                        <input type="checkbox" class="intermitTss">
                    </label>
                    <div class="ml-2 leading-[28px]">Intermittent?</div>
                </div>
            </div>

            <div class="mb-7 formParamNh3n hidden">
                <div class="flex items-center mb-5">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter Nh3n</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                Low Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number nh3nLowMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas bawah</div>
                            </div>
                            <ul class="nh3nLowMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                Low Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number nh3nLowWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas bawah</div>
                            </div>
                            <ul class="nh3nLowWarnError"></ul>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                High Mutu
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number nh3nHighMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas atas</div>
                            </div>
                            <ul class="nh3nHighMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                High Warn
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number nh3nHighWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas atas</div>
                            </div>
                            <ul class="nh3nHighWarnError"></ul>
                        </div>
                    </div>
                </div>
                <div class="flex">
                    <label>
                        <input type="checkbox" class="intermitNh3n">
                    </label>
                    <div class="ml-2 leading-[28px]">Intermittent?</div>
                </div>
            </div>

            <div class="mb-7 formParamDebit hidden">
                <div class="flex items-center mb-5">
                    <div class="h-[30px] w-[7px] bg-gray-300 mr-2"></div>
                    <div class="">
                        <div class="text-[13px] font-bold">Parameter Debit</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                Low Mutu /Menit
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number debitLowMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas bawah</div>
                            </div>
                            <ul class="debitLowMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(94,255,0)] mr-2"></div>
                                Low Warn /Menit
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number debitLowWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas bawah</div>
                            </div>
                            <ul class="debitLowWarnError"></ul>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(204,0,0)] mr-2"></div>
                                High Mutu /Menit
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number debitHighMutu">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai BML batas atas</div>
                            </div>
                            <ul class="debitHighMutuError"></ul>
                        </div>
                        <div class="form-group">
                            <label>
                                <div class="w-[7px] bg-[rgb(255,223,0)] mr-2"></div>
                                High Warn /Menit
                            </label>
                            <label class="form-group-control">
                                <input class="form-control number debitHighWarn">
                            </label>
                            <div class="info-alert-text !text-[12px]">
                                <div><i class="fas fa-info-circle mr-1"></i></div>
                                <div>Nilai Nearmiss batas atas</div>
                            </div>
                            <ul class="debitHighWarnError"></ul>
                        </div>
                    </div>
                </div>
                <div class="flex">
                    <label>
                        <input type="checkbox" class="intermitDebit">
                    </label>
                    <div class="ml-2 leading-[28px]">Intermittent?</div>
                </div>
            </div>

        </div>
    </div>
</div>
