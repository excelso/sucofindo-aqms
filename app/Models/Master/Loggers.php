<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Loggers extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_loggers';
        protected $fillable = [
            'uid',
            'pm_10',
            'pm_25',
            'tsp',
            'noise',
            'temp',
            'datetime_unix',
        ];

        public function scopeLoggerData(Builder $builder, $uid, $direction = 'ASC'): void {
            $builder->where('uid', $uid);
            $builder->orderBy('datetime_unix', $direction);
        }
    }
