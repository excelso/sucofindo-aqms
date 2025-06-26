<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Platforms extends Model {
        use SoftDeletes;

        protected $table = 't_platforms';
        protected $fillable = [
            'site_id',
            'uid',
            'cctv_link',
        ];
    }
