<?php

    namespace App\Models\BeSparing\Master\Geo;

    use Awobaz\Compoships\Compoships;
    use Illuminate\Database\Eloquent\Model;

    class Kecamatan extends Model {
        use Compoships;

        protected $guarded = [];
        protected $table = 't_geo_kecamatan';

    }
