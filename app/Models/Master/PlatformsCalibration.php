<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class PlatformsCalibration extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_platforms_calibration';
        protected $fillable = [
            'uid',
            'date_period',
        ];
    }
