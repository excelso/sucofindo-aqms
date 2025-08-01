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

        public function scopeLoggerData5Minutes(Builder $builder, $uid, $startDate, $untilDate, $timezone): void {
            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid, $timezone) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 300) * 300), 'UTC', ?) AS interval_time", [$timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / 300) * 300 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('ROUND(AVG(aqi_index), 2) AS aqi_index');
                $builder->from('t_loggers');
                $builder->where('uid', $uid);
                $builder->groupByRaw('uid, FLOOR(datetime_unix / 300)');
                $builder->orderByRaw('FLOOR(datetime_unix / 300) * 300');
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
            $builder->from(function ($builder) use ($uid, $timezone) {
                $builder->select([
                    'id',
                    'uid',
                    'link_video_recorded'
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 300) * 300), 'UTC', ?) AS interval_time", [$timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / 300) * 300 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('ROUND(AVG(aqi_index), 2) AS aqi_index');
                $builder->from('t_loggers');
                $builder->where('uid', $uid);
                $builder->groupByRaw('uid, FLOOR(datetime_unix / 300)');
                $builder->orderByRaw('FLOOR(datetime_unix / 300) * 300');
            }, 'summary');

            // Join dengan t_aqi_categories untuk mendapatkan kategori
            $builder->leftJoin('t_aqi_categories', function ($join) {
                $join->whereRaw('summary.pm_25 >= t_aqi_categories.pm25_min')
                    ->whereRaw('summary.pm_25 <= t_aqi_categories.pm25_max');
            });

            // Jika tidak ada kategori yang cocok (PM2.5 > 500), ambil kategori tertinggi
            $builder->leftJoin(DB::raw('(SELECT * FROM t_aqi_categories ORDER BY pm25_max DESC LIMIT 1) as highest_category'), function ($join) {
                $join->whereRaw('t_aqi_categories.id IS NULL');
            });

            $builder->addSelect([
                'summary.*',
                DB::raw('COALESCE(t_aqi_categories.category_name_en, highest_category.category_name_en) as category_name_en'),
                DB::raw('COALESCE(t_aqi_categories.category_name, highest_category.category_name) as category_name'),
                DB::raw('COALESCE(t_aqi_categories.color_code, highest_category.color_code) as color_code'),
                DB::raw('COALESCE(t_aqi_categories.emoji, highest_category.emoji) as emoji'),
                DB::raw('COALESCE(t_aqi_categories.id, highest_category.id) as category_id'),
                DB::raw('CONCAT("[", COALESCE(t_aqi_categories.pm25_min, highest_category.pm25_min), ", ", COALESCE(t_aqi_categories.pm25_max, highest_category.pm25_max), "]") as category_range')
            ]);

            $builder->whereBetween('summary.interval_time', [$startDate, $untilDate]);
            $builder->orderBy('summary.datetime_unix', 'DESC');
        }
    }
