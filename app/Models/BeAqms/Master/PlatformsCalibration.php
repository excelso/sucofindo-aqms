<?php

    namespace App\Models\BeAqms\Master;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class PlatformsCalibration extends Model {
        use SoftDeletes;

        protected $connection = 'aqms-mysql';
        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_platforms_calibration';
        protected $fillable = [
            'uid',
            'date_period',
        ];
    }
