<?php

    namespace App\Models\Master\Geo;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class GeoDistrict extends Model {
        protected $table = 't_geo_kecamatan';

        public function city(): BelongsTo {
            return $this->belongsTo(GeoCity::class, 'kabupaten_id', 'id');
        }
    }
