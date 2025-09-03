<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class PlatformsCalibrationDetail extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_platforms_calibration_detail';
        protected $fillable = [
            'logger_calibration_id',
            'date_data',
            'pm25_daily',
            'pm25_daily_hvas',
        ];
    }
