<div id="tabMaps">
    <div class="hidden !p-0 rounded-lg" id="maps">
        <div class="grid grid-cols-2 gap-4 px-5 pt-4">
            <div class="form-group">
                <label>
                    Latitude
                    <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="form-group-control">
                    <input type="text" class="form-control alamatLat" placeholder="...">
                </div>
                <ul class="alamatLatError"></ul>
            </div>
            <div class="form-group">
                <label>
                    Longitude
                    <span class="text-red-500 ml-1">*</span>
                </label>
                <div class="form-group-control">
                    <input type="text" class="form-control alamatLng" placeholder="...">
                </div>
                <ul class="alamatLngError"></ul>
            </div>
        </div>
        <img class="absolute z-[1] markerImage" src="{{ asset('images/maps/red-marker-512.png') }}" alt="" width="32">
        <div class="h-[calc(100vh-28rem)]" id="mapsBody"></div>
    </div>
</div>
