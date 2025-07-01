<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use DB;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class LoggersLimit extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_loggers_limit';
        protected $fillable = [
            'uid',
            'pm10_min',
            'pm10_min_buffer',
            'pm10_max_buffer',
            'pm10_max',
            'pm25_min',
            'pm25_min_buffer',
            'pm25_max_buffer',
            'pm25_max',
            'tsp_min',
            'tsp_min_buffer',
            'tsp_max_buffer',
            'tsp_max',
            'noise_min',
            'noise_min_buffer',
            'noise_max_buffer',
            'noise_max',
        ];
    }
