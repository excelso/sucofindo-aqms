<?php

    namespace App\Models\BeAqms\Master;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class PlatformsCalibrationDetail extends Model {
        use SoftDeletes;

        protected $connection = 'aqms-mysql';
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
