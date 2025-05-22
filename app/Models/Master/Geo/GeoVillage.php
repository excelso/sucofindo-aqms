<?php

    namespace App\Models\Master\Geo;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class GeoVillage extends Model {
        protected $table = 't_geo_desa';

        public function district(): BelongsTo {
            return $this->belongsTo(GeoDistrict::class, 'kecamatan_id', 'id');
        }
    }
