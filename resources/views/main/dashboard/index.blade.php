@section('title', 'Beranda')
<x-app-layout>
    <div class="content-main relative">
        <div class="absolute left-0 right-0 z-0">
            <div class="relative !h-[calc(100vh/2)] overflow-hidden">
                <div class="absolute inset-0 bg-sky-200/60 z-10"></div>
                <img src="{{ asset('images/bg-dashboard.png') }}" alt="bg"
                    class="absolute h-[95%] w-auto right-0 bottom-0 object-contain">
            </div>
        </div>

        <div class="relative px-8 py-4">
            <div class="py-8">
                <div class="text-[28px] font-bold">Good Morning, Widi</div>
                <div class="text-[15px] font-normal text-gray-500">Let's dive into air quality awareness.</div>
            </div>
            <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center gap-2 text-[15px] font-bold">
                    <div>
                        <i class="fas fa-eye"></i>
                    </div>
                    <div>Watchlist (12)</div>
                </div>

                <div class="flex items-center gap-2 text-[15px] font-bold">
                    <div>
                        <i class="fas fa-eye"></i>
                    </div>
                    <div>Watchlist (12)</div>
                </div>
            </div>

            <div class="mt-5">
                <div class="grid grid-cols-3 gap-4">
                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-orange-200 text-[12px] font-bold">
                                        <div>😞</div>
                                        <div class="mr-1">Moderate</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-JAKSEL-001
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">12.43</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">10.01</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">12.21</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">12</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-green-400/50 text-[12px] font-bold">
                                        <div>😍</div>
                                        <div class="mr-1">Very Good</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-JAKBAR-002
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">11.13</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">13.01</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">10.11</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">10</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-red-200 text-[12px] font-bold">
                                        <div>😷</div>
                                        <div class="mr-1">Unhealthy</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-JAKTIM-003
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">13.11</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">5.01</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">9.21</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">7</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-green-200 text-[12px] font-bold">
                                        <div>😊</div>
                                        <div class="mr-1">Good</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-TANGSEL-004
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">7.43</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">12.01</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">14.16</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">14</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-green-200 text-[12px] font-bold">
                                        <div>😊</div>
                                        <div class="mr-1">Good</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-DEPOK-001
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">14.13</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">13.01</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">10.21</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">14</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <div class="inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] bg-orange-200 text-[12px] font-bold">
                                        <div>😞</div>
                                        <div class="mr-1">Moderate</div>
                                    </div>
                                    <div class="text-[20px] font-bold mt-3">
                                        AQI-BOGOR-001
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="h-[10px] w-[10px] bg-green-500 rounded-full"></div>
                                        <div class="text-[14px]">Online</div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="chart-two"></div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM10</div>
                                        <div class="font-bold text-[18px]">14.13</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM2.5</div>
                                        <div class="font-bold text-[18px]">13.21</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>
                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">PM1.0</div>
                                        <div class="font-bold text-[18px]">15.21</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">µg/m³</div>
                                    </div>

                                    <div class="border rounded-md p-2">
                                        <div class="font-bold text-[12px] mb-2">Noise</div>
                                        <div class="font-bold text-[18px]">10</div>
                                        <div class="font-normal text-[12px] leading-[7px] mb-2">db</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="font-bold text-[14px]">Air Quality Forcast</div>
                                <div class="chart-one"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

@vite(['resources/js/main/dashboard/index.tsx'])
