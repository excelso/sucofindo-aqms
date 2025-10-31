<?php

    namespace App\Models\BeAqms\Master;

    use DB;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Loggers extends Model {
        use SoftDeletes;

        protected $connection = 'aqms-mysql';
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
            'aqi_index_tsp',
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
                    DB::raw('MAX(CASE WHEN link_video_recorded IS NOT NULL THEN link_video_recorded END) AS link_video_recorded')
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 600) * 600), 'Asia/Makassar', ?) AS interval_time", [$timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / 600) * 600 AS datetime_unix');
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('MAX( pm_10 ) AS max_pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('MAX( pm_25 ) AS max_pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('MAX( tsp ) AS max_tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('MAX( noise ) AS max_noise');
                $builder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
                $builder->selectRaw('ROUND(AVG(aqi_index)) AS aqi_index');
                $builder->selectRaw('MAX( aqi_index ) AS max_aqi_index');
                $builder->selectRaw('ROUND(AVG(aqi_index_tsp)) AS aqi_index_tsp');
                $builder->selectRaw('MAX( aqi_index_tsp ) AS max_aqi_index_tsp');
                $builder->selectRaw('IF( COALESCE( MAX(aqi_index_pm25), -1 ) >= COALESCE( MAX(aqi_index_pm10), -1 ), "PM 2.5", "PM 10" ) AS aqi_from');
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

            $intervalData = 600;
            if (isset($search['intervalData']) && $search['intervalData'] != '') {
                $intervalData = $search['intervalData'];
            }

            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid, $timezone, $search, $intervalData) {
                $builder->select([
                    't_loggers.id',
                    't_loggers.uid',
                    DB::raw('MAX(CASE WHEN link_video_recorded IS NOT NULL THEN link_video_recorded END) AS link_video_recorded')
                ]);
                // Gunakan timezone yang sama dengan parameter
                $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / ?) * ?), 'Asia/Makassar', ?) AS interval_time", [$intervalData, $intervalData, $timezone]);
                $builder->selectRaw('FLOOR(datetime_unix / ?) * ? AS datetime_unix', [$intervalData, $intervalData]);
                $builder->selectRaw('COUNT(*) AS record_count');
                $builder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                $builder->selectRaw('MAX( pm_10 ) AS max_pm_10');
                $builder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                $builder->selectRaw('MAX( pm_25 ) AS max_pm_25');
                $builder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                $builder->selectRaw('MAX( tsp ) AS max_tsp');
                $builder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                $builder->selectRaw('MAX( noise ) AS max_noise');
                $builder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
                $builder->selectRaw('ROUND(AVG(aqi_index)) AS aqi_index');
                $builder->selectRaw('MAX( aqi_index ) AS max_aqi_index');
                $builder->selectRaw('ROUND(AVG(aqi_index_tsp)) AS aqi_index_tsp');
                $builder->selectRaw('MAX( aqi_index_tsp ) AS max_aqi_index_tsp');
                $builder->selectRaw('IF( COALESCE( AVG(aqi_index_pm25), -1 ) >= COALESCE( AVG(aqi_index_pm10), -1 ), "PM 2.5", "PM 10" ) AS aqi_from');
                $builder->from('t_loggers');

                if (isset($search['platformUid']) && $search['platformUid'] != '') {
                    $builder->where('t_loggers.uid', $search['platformUid']);
                } else {
                    $builder->where('t_loggers.uid', $uid);
                }

                $builder->groupByRaw('t_loggers.uid, FLOOR(datetime_unix / ?)', [$intervalData]);
                $builder->orderByRaw('FLOOR(datetime_unix / ?) * ?', [$intervalData, $intervalData]);
            }, 'summary');

            $builder->leftJoin('t_loggers_limit', 't_loggers_limit.uid', '=', 'summary.uid');

            $builder->addSelect([
                'summary.*'
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
                if ($search['statusAqi'] == 'good') {
                    $builder->where(DB::raw('CASE WHEN summary.max_tsp < t_loggers_limit.tsp_max_buffer THEN 1 ELSE 0 END'), '=', 1);
                } else if ($search['statusAqi'] == 'mode') {
                    $builder->where(DB::raw('CASE WHEN summary.max_tsp > t_loggers_limit.tsp_max_buffer AND summary.max_tsp < t_loggers_limit.tsp_max THEN 1 ELSE 0 END'), '=', 1);
                } else {
                    $builder->where(DB::raw('CASE WHEN summary.max_tsp > t_loggers_limit.tsp_max THEN 1 ELSE 0 END'), '=', 1);
                }
            }

            $builder->orderBy('summary.datetime_unix', 'DESC');
        }

        public function scopeReportLoggerPerMenitData(Builder $builder, $uid, $startDate, $untilDate, $timezone, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            // $builder->select('t_loggers.* ');
            // $builder->select('pm_10 AS max_pm_10');
            // $builder->select('pm_25 AS max_pm_25');
            // $builder->select('tsp AS max_tsp');
            // // $builder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
            // $builder->select('aqi_index AS max_aqi_index');
            // $builder->select('aqi_index_tsp AS max_aqi_index_tsp');

            $builder->leftJoin('t_loggers_limit', 't_loggers_limit.uid', '=', 't_loggers.uid');

            if (isset($search['platformUid']) && $search['platformUid'] != '') {
                $builder->where('t_loggers.uid', $search['platformUid']);
            } else {
                $builder->where('t_loggers.uid', $uid);
            }

            if (!empty($search['startDate']) && !empty($search['untilDate'])) {
                $builder->whereBetween(DB::raw('CONVERT_TZ( FROM_UNIXTIME( t_loggers.datetime_unix, "%Y-%m-%d %H:%i" ), "Asia/Makassar", "' . $timezone . '" )'), [$search['startDate'], $search['untilDate']]);
            } elseif (!empty($search['startDate'])) {
                $builder->where(DB::raw('CONVERT_TZ( FROM_UNIXTIME( t_loggers.datetime_unix, "%Y-%m-%d %H:%i" ), "Asia/Makassar", "' . $timezone . '" )'), '=', $search['startDate']);
            } else {
                $builder->whereBetween(DB::raw('CONVERT_TZ( FROM_UNIXTIME( t_loggers.datetime_unix, "%Y-%m-%d %H:%i" ), "Asia/Makassar", "' . $timezone . '" )'), [$startDate, $untilDate]);
            }

            if (isset($search['statusAqi']) && $search['statusAqi'] != '') {
                if ($search['statusAqi'] == 'good') {
                    $builder->where(DB::raw('CASE WHEN t_loggers.tsp < t_loggers_limit.tsp_max_buffer THEN 1 ELSE 0 END'), '=', 1);
                } else if ($search['statusAqi'] == 'mode') {
                    $builder->where(DB::raw('CASE WHEN t_loggers.tsp > t_loggers_limit.tsp_max_buffer AND t_loggers.tsp < t_loggers_limit.tsp_max THEN 1 ELSE 0 END'), '=', 1);
                } else {
                    $builder->where(DB::raw('CASE WHEN t_loggers.tsp > t_loggers_limit.tsp_max THEN 1 ELSE 0 END'), '=', 1);
                }
            }

            $builder->orderBy('t_loggers.datetime_unix', 'DESC');
        }

        public function scopeLoggerDataDaily(Builder $builder, $uid, $startDate, $untilDate, $timezone): void {
            $builder->withoutGlobalScopes();
            $builder->from(function ($builder) use ($uid, $startDate, $untilDate, $timezone) {
                // Subquery untuk data 10 menit (menggunakan scope yang sudah ada)
                $builder->select([
                    DB::raw('DATE(ten_minute_data.interval_time) AS tanggal'),
                    'ten_minute_data.uid',
                    DB::raw('MAX(ten_minute_data.link_video_recorded) AS link_video_recorded'),
                    DB::raw('COUNT(*) AS total_intervals'),
                    DB::raw('ROUND(AVG(ten_minute_data.pm_10), 0) AS pm_10'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_pm_10), 0) AS max_pm_10'),
                    DB::raw('ROUND(AVG(ten_minute_data.pm_25), 0) AS pm_25'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_pm_25), 0) AS max_pm_25'),
                    DB::raw('ROUND(AVG(ten_minute_data.tsp), 0) AS tsp'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_tsp), 0) AS max_tsp'),
                    DB::raw('ROUND(AVG(ten_minute_data.noise), 2) AS noise'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_noise), 2) AS max_noise'),
                    DB::raw('ROUND(AVG(ten_minute_data.noise_leq), 2) AS noise_leq'),
                    DB::raw('ROUND(AVG(ten_minute_data.aqi_index)) AS aqi_index'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_aqi_index)) AS max_aqi_index'),
                    DB::raw('ROUND(AVG(ten_minute_data.aqi_index_tsp)) AS aqi_index_tsp'),
                    DB::raw('ROUND(MAX(ten_minute_data.max_aqi_index_tsp)) AS max_aqi_index_tsp'),
                    DB::raw('IF(AVG(ten_minute_data.aqi_index_pm25) >= AVG(ten_minute_data.aqi_index_pm10), "PM 2.5", "PM 10") AS aqi_from')
                ]);

                $builder->from(function ($subBuilder) use ($uid, $timezone) {
                    $subBuilder->select([
                        'id',
                        'uid',
                        DB::raw('MAX(CASE WHEN link_video_recorded IS NOT NULL THEN link_video_recorded END) AS link_video_recorded')
                    ]);
                    $subBuilder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(FLOOR(datetime_unix / 600) * 600), 'Asia/Makassar', ?) AS interval_time", [$timezone]);
                    $subBuilder->selectRaw('FLOOR(datetime_unix / 600) * 600 AS datetime_unix');
                    $subBuilder->selectRaw('COUNT(*) AS record_count');
                    $subBuilder->selectRaw('ROUND(AVG(pm_10), 0) AS pm_10');
                    $subBuilder->selectRaw('MAX(pm_10) AS max_pm_10');
                    $subBuilder->selectRaw('ROUND(AVG(pm_25), 0) AS pm_25');
                    $subBuilder->selectRaw('MAX(pm_25) AS max_pm_25');
                    $subBuilder->selectRaw('ROUND(AVG(tsp), 0) AS tsp');
                    $subBuilder->selectRaw('MAX(tsp) AS max_tsp');
                    $subBuilder->selectRaw('ROUND(AVG(noise), 2) AS noise');
                    $subBuilder->selectRaw('MAX(noise) AS max_noise');
                    $subBuilder->selectRaw('ROUND((10 * LOG10((1/count(*) * SUM(POWER(10, noise / 10))))), 2) AS noise_leq');
                    $subBuilder->selectRaw('ROUND(AVG(aqi_index_pm25), 2) AS aqi_index_pm25');
                    $subBuilder->selectRaw('ROUND(AVG(aqi_index_pm10), 2) AS aqi_index_pm10');
                    $subBuilder->selectRaw('ROUND(AVG(aqi_index)) AS aqi_index');
                    $subBuilder->selectRaw('MAX(aqi_index) AS max_aqi_index');
                    $subBuilder->selectRaw('ROUND(AVG(aqi_index_tsp)) AS aqi_index_tsp');
                    $subBuilder->selectRaw('MAX(aqi_index_tsp) AS max_aqi_index_tsp');
                    $subBuilder->from('t_loggers');
                    $subBuilder->where('uid', $uid);
                    $subBuilder->groupByRaw('uid, FLOOR(datetime_unix / 600)');
                    $subBuilder->orderByRaw('FLOOR(datetime_unix / 600) * 600');
                }, 'ten_minute_data');

                $builder->whereBetween('ten_minute_data.interval_time', [$startDate, $untilDate]);
                $builder->groupByRaw('DATE(ten_minute_data.interval_time), ten_minute_data.uid');
                $builder->orderBy('tanggal', 'DESC');

            }, 'daily_summary');
        }

        public function scopeCalculateAvgData(Builder $builder, $uid, $timezone, $month, $year): void {
            $builder->select([
                't_loggers.uid',
                DB::raw('ROUND(AVG(t_loggers.pm_25), 2) as pm_25'),
                DB::raw('ROUND(AVG(t_loggers.pm_10), 2) as pm_10'),
                DB::raw('ROUND(AVG(t_loggers.tsp), 2) as tsp'),
                DB::raw('ROUND(AVG(t_loggers.noise), 2) as noise'),
            ]);

            $builder->where('t_loggers.uid', $uid);
            $builder->whereRaw('MONTH(CONVERT_TZ(FROM_UNIXTIME(t_loggers.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", ?)) = ?', [$timezone, $month]);
            $builder->whereRaw('YEAR(CONVERT_TZ(FROM_UNIXTIME(t_loggers.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", ?)) = ?', [$timezone, $year]);
        }

        //region Handle Data Persentase Entry Weekly
        public function scopeDataPercentageEntryWeekly(Builder $builder, $platformUid, $minDate, $maxDate, $timezone, $totalSample): void {
            $builder->select([
                DB::raw("(COUNT(*) / $totalSample) * 100 as percentage")
            ]);

            $builder->where('t_loggers.uid', $platformUid);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_loggers.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
        }

        //endregion

        public function scopeDataSensorWeekly(
            Builder $builder,
                    $platformUid,
                    $minDate,
                    $maxDate,
                    $timezone,
                    $intervalMinutes = 10
        ): void {

            $builder->select([
                'uid',
                DB::raw('ROUND(AVG(t_loggers.pm_25), 2) as pm_25'),
                DB::raw('ROUND(AVG(t_loggers.pm_10), 2) as pm_10'),
                DB::raw('ROUND(AVG(t_loggers.tsp), 2) as tsp'),
                DB::raw('ROUND(AVG(t_loggers.noise), 2) as noise'),

                // Format waktu
                DB::raw("TIME(CONCAT(
                    HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar')),
                    ':',
                    LPAD(
                        FLOOR(
                            MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar')) / {$intervalMinutes}
                        ) * {$intervalMinutes},
                        2,
                        '0'
                    ),
                    ':00'
                )) as datetime_format"),

                // ✅ Normalize ke tanggal dummy (2025-01-01) - semua week punya tanggal sama
                DB::raw("UNIX_TIMESTAMP(
                    CONCAT(
                        '2025-01-01 ',
                        DATE_FORMAT(
                            CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', '{$timezone}'),
                            CONCAT(
                                '%H:',
                                LPAD(FLOOR(MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', '{$timezone}')) / {$intervalMinutes}) * {$intervalMinutes}, 2, '0'),
                                ':00'
                            )
                        )
                    )
                ) as datetime_unix_interval")
            ]);

            // Filter berdasarkan UID dan rentang tanggal
            $builder->where('t_loggers.uid', $platformUid)
                ->whereRaw("
                    DATE(CONVERT_TZ(FROM_UNIXTIME(t_loggers.datetime_unix), 'Asia/Makassar', ?))
                    BETWEEN ? AND ?
                ", [$timezone, $minDate, $maxDate]);

            // Group by
            $builder->groupByRaw("
                HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', ?)),
                FLOOR(MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', ?)) / ?)
            ", [$timezone, $timezone, $intervalMinutes]);

            // Order by
            $builder->orderByRaw("
                HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', ?)),
                FLOOR(MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', ?)) / ?)
            ", [$timezone, $timezone, $intervalMinutes]);
        }
    }
