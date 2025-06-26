<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use DB;
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

        public function scopeLoggerData(Builder $builder, $uids, $direction = 'ASC'): void {
            $builder->where('uid', $uids);
            $builder->orderBy('datetime_unix', $direction);
        }

        public function scopeLoggerBulkData(Builder $builder, $uids): void {
            $builder->where('uid', $uids);
            $builder->whereIn('id', function ($query) use ($uids) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('t_loggers')
                    ->whereIn('uid', $uids)->groupBy('uid');
            });
        }
    }
