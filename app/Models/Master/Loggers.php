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
            'pm_25',
            'pm_10',
            'tsp',
            'noise',
            'temp',
            'aqi_index_pm25',
            'aqi_index_pm10',
            'aqi_index',
            'aqi_from',
            'link_video_id',
            'link_video_status',
            'link_video_recorded',
            'link_video_message',
            'tipe_logger',
            'datetime_unix',
        ];

        public function limit(): HasOne|Loggers|Builder {
            return $this->hasOne(LoggersLimit::class, 'uid', 'uid');
        }

        public function scopeLoggerData(Builder $builder, $uids, $startDate, $untilDate, $timezone, $direction = 'ASC'): void {
            $builder->where('uid', $uids);
            $builder->orderBy('datetime_unix', $direction);
        }

        public function scopeLoggerData5Minutes(Builder $builder, $uid, $startDate, $untilDate, $timezone): void {
            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid, $timezone) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 600) * 600), 'UTC', ?) AS interval_time", [$timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / 600) * 600 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
                $builder->selectRaw('ROUND(AVG(aqi_index)) AS aqi_index');
                $builder->selectRaw('IF( COALESCE( AVG(aqi_index_pm25), -1 ) >= COALESCE( AVG(aqi_index_pm10), -1 ), "PM 2.5", "PM 10" ) AS aqi_from');
                $builder->from('t_loggers');
                $builder->where('uid', $uid);
                $builder->groupByRaw('uid, FLOOR(datetime_unix / 600)');
                $builder->orderByRaw('FLOOR(datetime_unix / 600) * 600');
            }, 'summary');

            $builder->whereBetween('summary.interval_time', [$startDate, $untilDate]);
        }

        public function scopeLoggerBulkData(Builder $builder, $uids): void {
            $builder->where('uid', $uids);
            $builder->whereIn('id', function ($query) use ($uids) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('t_loggers')
                    ->whereIn('uid', $uids)->groupBy('uid');
            });
        }

        public function scopeReportLoggerData(Builder $builder, $uid, $startDate, $untilDate, $timezone, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid, $timezone, $search) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 600) * 600), 'UTC', ?) AS interval_time", [$timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / 600) * 600 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
                $builder->selectRaw('ROUND(AVG(aqi_index)) AS aqi_index');
                $builder->selectRaw('IF( COALESCE( AVG(aqi_index_pm25), -1 ) >= COALESCE( AVG(aqi_index_pm10), -1 ), "PM 2.5", "PM 10" ) AS aqi_from');
                $builder->from('t_loggers');

                if (isset($search['platformUid']) && $search['platformUid'] != '') {
                    $builder->where('uid', $search['platformUid']);
                } else {
                    $builder->where('uid', $uid);
                }

                $builder->groupByRaw('uid, FLOOR(datetime_unix / 600)');
                $builder->orderByRaw('FLOOR(datetime_unix / 600) * 600');
            }, 'summary');

            // Join dengan t_aqi_categories untuk mendapatkan kategori
            $builder->leftJoin('t_aqi_categories', function ($join) {
                $join->whereRaw('ROUND(summary.aqi_index) >= t_aqi_categories.aqi_min')
                    ->whereRaw('ROUND(summary.aqi_index) <= t_aqi_categories.aqi_max');
            });

            // Jika tidak ada kategori yang cocok (PM2.5 > 500), ambil kategori tertinggi
            $builder->leftJoin(DB::raw('(SELECT * FROM t_aqi_categories ORDER BY aqi_max DESC LIMIT 1) as highest_category'), function ($join) {
                $join->whereRaw('t_aqi_categories.id IS NULL');
            });

            $builder->addSelect([
                'summary.*',
                DB::raw('COALESCE(t_aqi_categories.category_name_en, highest_category.category_name_en) as category_name_en'),
                DB::raw('COALESCE(t_aqi_categories.category_name, highest_category.category_name) as category_name'),
                DB::raw('COALESCE(t_aqi_categories.color_code, highest_category.color_code) as color_code'),
                DB::raw('COALESCE(t_aqi_categories.emoji, highest_category.emoji) as emoji'),
                DB::raw('COALESCE(t_aqi_categories.id, highest_category.id) as category_id'),
                DB::raw('CONCAT("[", COALESCE(t_aqi_categories.aqi_min, highest_category.aqi_min), ", ", COALESCE(t_aqi_categories.aqi_max, highest_category.aqi_max), "]") as category_range')
            ]);

            if (isset($search['platformUid']) && $search['platformUid'] != '') {
                $builder->where('summary.uid', $search['platformUid']);
            }

            if (!empty($search['startDate']) && !empty($search['untilDate'])) {
                $builder->whereBetween('summary.interval_time', [$search['startDate'], $search['untilDate']]);
            } elseif (!empty($search['startDate'])) {
                $builder->where('summary.interval_time', '=', $search['startDate']);
            } else {
                $builder->whereBetween('summary.interval_time', [$startDate, $untilDate]);
            }

            if (isset($search['statusAqi']) && $search['statusAqi'] != '') {
                $builder->where('t_aqi_categories.id', $search['statusAqi']);
            }

            $builder->orderBy('summary.datetime_unix', 'DESC');
        }
    }
