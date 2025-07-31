<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use DB;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasOne;
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
            'link_video_id',
            'link_video_status',
            'link_video_recorded',
            'datetime_unix',
        ];

        public function limit(): HasOne|Loggers|Builder {
            return $this->hasOne(LoggersLimit::class, 'uid', 'uid');
        }

        public function scopeLoggerData(Builder $builder, $uids, $direction = 'ASC'): void {
            $builder->where('uid', $uids);
            $builder->orderBy('datetime_unix', $direction);
        }

        public function scopeLoggerData5Minutes(Builder $builder, $uid): void {
            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                $builder->selectRaw('FROM_UNIXTIME(FLOOR(datetime_unix / 300) * 300) AS interval_time');
                $builder->selectRaw('FLOOR(datetime_unix / 300) * 300 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->from('t_loggers');
                $builder->where('uid', $uid);
                $builder->groupByRaw('uid, FLOOR(datetime_unix / 300)');
                $builder->orderByRaw('FLOOR(datetime_unix / 300) * 300');
            }, 'summary');
        }

        public function scopeLoggerBulkData(Builder $builder, $uids): void {
            $builder->where('uid', $uids);
            $builder->whereIn('id', function ($query) use ($uids) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('t_loggers')
                    ->whereIn('uid', $uids)->groupBy('uid');
            });
        }

        public function scopeReportLoggerData(Builder $builder, $uid, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                $builder->selectRaw('FROM_UNIXTIME(FLOOR(datetime_unix / 300) * 300) AS interval_time');
                $builder->selectRaw('FLOOR(datetime_unix / 300) * 300 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->from('t_loggers');
                $builder->where('uid', $uid);
                $builder->groupByRaw('uid, FLOOR(datetime_unix / 300)');
                $builder->orderByRaw('FLOOR(datetime_unix / 300) * 300');
            }, 'summary');

            $builder->orderBy('summary.datetime_unix', 'DESC');
        }
    }
