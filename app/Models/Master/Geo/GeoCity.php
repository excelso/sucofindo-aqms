<?php

    namespace App\Models\Master\Geo;

    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class GeoCity extends Model {
        protected $table = 't_geo_kabupaten';

        public function province(): BelongsTo {
            return $this->belongsTo(GeoProvince::class, 'provinsi_id', 'id');
        }
    }
