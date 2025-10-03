<div class="modal hidden modalPower">
    <div class="modal-main !w-[calc(1440px-250px)]">
        <div class="modal-head">
            <div class="flex justify-between items-center">
                <div class="modal-title">
                    <i class="fas fa-bolt mr-2"></i> Power Status
                </div>
                <div>
                    <div class="cursor-pointer closeModalForm">
                        <i class="fas fa-close"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-body overflow-y-auto !max-h-[calc(100vh-12rem)]">
            <div class="grid grid-cols-[250px_400px_250px_230px] gap-2">
                <div class="col-span-1">
                    <div class="flex items-center mb-5">
                        <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="text-[17px] font-bold">Solar Info</div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Solar Current (A)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate solarAmpere">0A</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-info-circle"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Solar Voltage (V)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate solarVolt">0V</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-bolt"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Solar Power (W)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate solarWattage">0W</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-plug-circle-bolt"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="flex items-center mb-5">
                        <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="text-[17px] font-bold">Battery Info</div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Battery Current (A)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate batteryAmpere">0A</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-info-circle"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Battery Voltage (V)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate batteryVolt">0V</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-bolt"></i>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="col-span-1">
                            <div class="card mb-2">
                                <div class="card-body !py-[10px]">
                                    <div class="flex items-center"><span class="text-[14px]">Battery Temp (°C)</span></div>
                                    <div class="font-bold text-[15px] leading-[18px] truncate batteryTemp">0°C</div>
                                    <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                        <i class="fas fa-temperature-half"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-1">
                            <div class="card mb-2">
                                <div class="card-body !py-[10px]">
                                    <div class="flex items-center"><span class="text-[14px]">Battery COC (%)</span></div>
                                    <div class="font-bold text-[15px] leading-[18px] truncate batteryCOC">0%</div>
                                    <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                        <i class="fas fa-battery-half"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="flex items-center mb-5">
                        <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="text-[17px] font-bold">DC Load Info</div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Load Current (A)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate outputAmpere">0A</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-info-circle"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Load Volt (V)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate outputVolt">0V</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-bolt"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Load Power (W)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate outputWattage">0W</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-plug-circle-bolt"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div class="flex items-center mb-5">
                        <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="text-[17px] font-bold">Controller Info</div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body !py-[10px]">
                            <div class="flex items-center"><span class="text-[14px]">Device Temp (°C)</span></div>
                            <div class="font-bold text-[15px] leading-[18px] truncate deviceTemp">0°C</div>
                            <div class="absolute right-[20px] top-[5px] text-[35px] opacity-[0.1]">
                                <i class="fas fa-temperature-half"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-10">
                <div class="flex items-center justify-between">
                    <div class="flex items-center mb-5">
                        <div class="h-[40px] w-[7px] bg-gray-300 mr-2"></div>
                        <div class="text-[17px] font-bold">Realtime Curve</div>
                    </div>
                    <div>
                        <ul class="flex flex-wrap text-sm font-medium text-center rounded-lg p-1 text-gray-500" data-role="exTabs" data-tabs-toggle="#waterTab">
                            <li class="mr-2 grow-[1]">
                                <a class="inline-block px-4 py-3 rounded-lg cursor-pointer w-full" data-tabs-target="#dataVoltChart">
                                    Voltage
                                </a>
                            </li>
                            <li class="mr-2 grow-[1]">
                                <a class="inline-block px-4 py-3 rounded-lg cursor-pointer w-full" data-tabs-target="#dataCurrChart">
                                    Current
                                </a>
                            </li>
                            <li class="mr-2 grow-[1]">
                                <a class="inline-block px-4 py-3 rounded-lg cursor-pointer w-full" data-tabs-target="#dataPowerChart">
                                    Power
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div>
                    <div id="dataVoltChart" class="p-5">
                        <div class="bodyVoltChart !h-[425px]"></div>
                    </div>
                    <div id="dataCurrChart" class="p-5">
                        <div class="bodyCurrentChart !h-[425px]"></div>
                    </div>
                    <div id="dataPowerChart" class="p-5">
                        <div class="bodyPowerChart !h-[425px]"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer justify-between">
            <div class="ml-auto">
                <button type="submit" class="ds-btn ds-btn-primary normal-case closeModalForm">
                    <i class="fas fa-close mr-2"></i> Tutup
                </button>
            </div>
        </div>
    </div>
</div>
