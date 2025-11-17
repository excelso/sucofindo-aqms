<?php

    namespace App\Models\BeSparing\Master;

    use Auth;
    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo as RelationsBelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Support\Facades\DB;

    class Platform extends Model {
        use Compoships, SoftDeletes;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_platform';

        public function site(): BelongsTo {
            return $this->belongsTo(Site::class, 'site_id', 'id');
        }

        public function paramLimit(): BelongsTo {
            return $this->belongsTo(ParameterLimit::class, ['uid', 'tipe_logger'], ['uid', 'tipe_logger']);
        }

        public function paramRange(): BelongsTo {
            return $this->belongsTo(ParameterRange::class, ['uid', 'tipe_logger'], ['uid', 'tipe_logger']);
        }

        public function dokumen(): HasMany {
            return $this->hasMany(PlatformDokumen::class, 'platform_id', 'id');
        }

        public function scopePlatform(Builder $builder, $options = []): void {
            $search = [];
            $siteId = [];
            if (count($options) != 0) {
                $search = $options['search'];
                $siteId = $options['siteId'];
            }

            $builder->select('*');

            if (request()->user()->user_level != 'super_admin') {
                if (count($siteId) != 0) {
                    $builder->whereIn('site_id', $siteId);
                }
            }

            if (isset($search['uid']) && $search['uid'] != '') {
                $builder->where('t_platform.uid', 'LIKE', '%' . $search['uid'] . '%');
            }

            if (isset($search['customer_id']) && $search['customer_id'] != '') {
                $builder->where('t_platform.customer_id', '=', $search['customer_id']);
            }

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $builder->whereHas('site', function ($q) use ($search) {
                    $q->where('customer_lokasi_id', '=', $search['customer_lokasi_id']);
                });
            }

            if (isset($search['site_id']) && $search['site_id'] != '') {
                $builder->where('t_platform.site_id', '=', $search['site_id']);
            }

            if (isset($search['jenis_industri']) && $search['jenis_industri'] != '') {
                $builder->whereHas('site.customer', function ($query) use ($search) {
                    $query->where('industri_id', '=', $search['jenis_industri']);
                });
            }

            $builder->orderBy('uid');
            $builder->orderBy('tipe_logger');
        }

        //region Handle Persentase Data Comply Weekly Summary
        public function scopePlatformWeeklySummary(
            Builder $builder,
            string  $minDate,
            string  $maxDate,
            string  $timezone = 'Asia/Jakarta',
            ?int    $userId = null,
            ?string $platformUid = null,
            ?int    $siteLokasiId = null,
            ?int    $tipeLogger = null
        ): void {
            $connection = DB::connection('sparing-mysql');

            $minUnix = $connection->selectOne(
                "SELECT UNIX_TIMESTAMP(CONVERT_TZ(?, ?, 'Asia/Makassar')) as unix",
                [$minDate . ' 00:00:00', $timezone]
            )->unix;

            $maxUnix = $connection->selectOne(
                "SELECT UNIX_TIMESTAMP(CONVERT_TZ(?, ?, 'Asia/Makassar')) as unix",
                [$maxDate . ' 23:59:59', $timezone]
            )->unix;

            // Join subquery untuk agregasi data
            $builder->leftJoinSub(function ($subquery) use ($minUnix, $maxUnix) {
                $subquery->from('t_parameter')
                    ->leftJoin('t_parameter_limit', function ($join) {
                        $join->on('t_parameter.uid', '=', 't_parameter_limit.uid')
                            ->on('t_parameter.tipe_logger', '=', 't_parameter_limit.tipe_logger');
                    })
                    ->select(
                        't_parameter.uid',
                        't_parameter.tipe_logger',
                        DB::raw('COUNT(*) as total'),

                        // pH counts
                        DB::raw("SUM(CASE
                    WHEN (t_parameter.ph <= 0 AND t_parameter_limit.ph_intermit = 1) OR
                         (t_parameter.ph > t_parameter_limit.ph_warn_min AND t_parameter.ph < t_parameter_limit.ph_warn_max)
                    THEN 1 ELSE 0
                END) as ph_normal"),

                        DB::raw("SUM(CASE
                    WHEN (t_parameter.ph > t_parameter_limit.ph_mutu_min AND t_parameter.ph <= t_parameter_limit.ph_warn_min) OR
                         (t_parameter.ph >= t_parameter_limit.ph_warn_max AND t_parameter.ph < t_parameter_limit.ph_mutu_max)
                    THEN 1 ELSE 0
                END) as ph_warning"),

                        // TSS counts
                        DB::raw("SUM(CASE
                    WHEN (t_parameter.tss <= 0 AND t_parameter_limit.tss_intermit = 1) OR
                         (t_parameter.tss > t_parameter_limit.tss_warn_min AND t_parameter.tss < t_parameter_limit.tss_mutu_min)
                    THEN 1 ELSE 0
                END) as tss_normal"),

                        DB::raw("SUM(CASE
                    WHEN (t_parameter.tss > t_parameter_limit.tss_warn AND t_parameter.tss <= t_parameter_limit.tss_warn_min) OR
                         (t_parameter.tss >= t_parameter_limit.tss_mutu_min AND t_parameter.tss < t_parameter_limit.tss_mutu)
                    THEN 1 ELSE 0
                END) as tss_warning"),

                        // Debit counts
                        DB::raw("SUM(CASE
                    WHEN (t_parameter.debit <= 0 AND t_parameter_limit.debit_intermit = 1) OR
                         (t_parameter.debit > t_parameter_limit.debit_warn_min AND t_parameter.debit < t_parameter_limit.debit_mutu_min)
                    THEN 1 ELSE 0
                END) as debit_normal"),

                        DB::raw("SUM(CASE
                    WHEN (t_parameter.debit >= t_parameter_limit.debit_warn AND t_parameter.debit <= t_parameter_limit.debit_warn_min) OR
                         (t_parameter.debit >= t_parameter_limit.debit_mutu_min AND t_parameter.debit < t_parameter_limit.debit_mutu)
                    THEN 1 ELSE 0
                END) as debit_warning"),
                    )
                    ->whereBetween('t_parameter.datetime_unix', [$minUnix, $maxUnix])
                    ->groupBy('t_parameter.uid', 't_parameter.tipe_logger');
            }, 'stats', function ($join) {
                $join->on('stats.uid', '=', 't_platform.uid')
                    ->on('stats.tipe_logger', '=', 't_platform.tipe_logger');
            });

            $builder->leftJoin('t_customer_site', 't_platform.site_id', '=', 't_customer_site.id');
            $builder->leftJoin('t_customer_lokasi', 't_customer_site.customer_lokasi_id', '=', 't_customer_lokasi.id');

            // Join untuk filter user
            if ($userId !== null) {
                $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                $builder->join('t_users_sites_tipe_logger', function ($join) {
                    $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                    $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                    $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
                });

                $builder->where('t_users_sites.user_id', '=', $userId);
                $builder->where('t_users_sites.status_site', '=', 1);
            }

            // Select columns
            $builder->select(
                't_platform.uid',
                't_platform.tipe_logger',
                't_platform.site_id',
                DB::raw('(IFNULL(stats.ph_normal, 0) + IFNULL(stats.ph_warning, 0)) / NULLIF(stats.total, 0) * 100 as percentagePh'),
                DB::raw('(IFNULL(stats.tss_normal, 0) + IFNULL(stats.tss_warning, 0)) / NULLIF(stats.total, 0) * 100 as percentageTss'),
                DB::raw('(IFNULL(stats.debit_normal, 0) + IFNULL(stats.debit_warning, 0)) / NULLIF(stats.total, 0) * 100 as percentageDebit'),
                'stats.total',
                DB::raw('ROUND(((stats.total / 5040) * 100), 2) AS persen'),
                'stats.ph_normal',
                'stats.ph_warning',
                'stats.tss_normal',
                'stats.tss_warning',
                'stats.debit_normal',
                'stats.debit_warning'
            );

            // Optional filters
            if ($platformUid) {
                $builder->where('t_platform.uid', $platformUid);
            }

            if ($tipeLogger !== null) {
                $builder->where('t_platform.tipe_logger', $tipeLogger);
            }

            if ($siteLokasiId !== null) {
                $builder->where('t_customer_site.customer_lokasi_id', $siteLokasiId);
            }

            $builder->orderBy('t_customer_site.customer_lokasi_id', 'ASC');
        }

        //endregion

        public function scopeDataPlatformInfo(Builder $builder, $platformUid, $tipeLogger): void {
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp1Uid,
                        t_parameter.tipe_logger as tHelp1TipeLogger,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid, t_parameter.tipe_logger
                ) tHelp1
            '), function ($join) {
                $join->on('tHelp1.tHelp1Uid', '=', 't_platform.uid');
                $join->on('tHelp1.tHelp1TipeLogger', '=', 't_platform.tipe_logger');
            });

            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp2Uid,
                        COUNT(t_parameter.id) as has_power
                    FROM t_parameter
                    WHERE t_parameter.solar_volt != 0
                      AND t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = "' . $tipeLogger . '"
                ) tHelp2
            '), 'tHelp2.tHelp2Uid', '=', 't_platform.uid');

            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp3Uid,
                        COUNT(t_parameter.id) as has_temperature
                    FROM t_parameter
                    WHERE t_parameter.temp != 0
                      AND t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = "' . $tipeLogger . '"
                ) tHelp3
            '), 'tHelp3.tHelp3Uid', '=', 't_platform.uid');
            $builder->with('site.customer.jenisIndustri');
            $builder->where('t_platform.uid', $platformUid);
            $builder->where('t_platform.tipe_logger', $tipeLogger);
        }

        public function scopeParameterAvailable(Builder $builder, $platformUid, $tipeLogger): void {
            $builder->with('site.customer.jenisIndustri');
            $builder->where('uid', $platformUid);
            $builder->where('tipe_logger', $tipeLogger);
        }

        public function scopePlatformBySearch(Builder $builder, $userId, $heartbeatStatus = null, $search = ''): void {
            $builder->distinct();
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp1Uid,
                        t_parameter.tipe_logger as tHelp1TipeLogger,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid, t_parameter.tipe_logger
                ) tHelp1
            '), function ($join) {
                $join->on('tHelp1.tHelp1Uid', '=', 't_platform.uid');
                $join->on('tHelp1.tHelp1TipeLogger', '=', 't_platform.tipe_logger');
            });

            $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $builder->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });
            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);

            if ($heartbeatStatus) {
                if ($heartbeatStatus != 1) {
                    if ($heartbeatStatus == 2) {
                        $builder->where('t_platform.status_platform', '=', 'online');
                    } else {
                        $builder->where('t_platform.status_platform', '=', 'offline');
                    }
                }
            }

            if ($search != '') {
                $builder->where(function ($query) use ($search) {
                    $query->where('uid', 'LIKE', '%' . $search . '%');
                    $query->orWhereHas('site', function ($qHas) use ($search) {
                        $qHas->where('nama_site', 'LIKE', '%' . $search . '%');
                    });
                    $query->orWhereHas('site.customer', function ($qHas) use ($search) {
                        $qHas->where('nama_perusahaan', 'LIKE', '%' . $search . '%');
                    });
                });
            }

            $builder->orderBy('last_online', 'DESC');
            $builder->orderBy('t_platform.tipe_logger');
        }

        public function scopeEnviroPlatformBySearch(Builder $query, $userId, $heartbeatStatus = null, $search = '', $uid = null): void {
            $query->select('t_platform.*', 'tHelp1.last_online');

            $query->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp1Uid,
                        t_parameter.tipe_logger as tHelp1TipeLogger,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid, t_parameter.tipe_logger
                ) tHelp1
            '), function ($join) {
                $join->on('tHelp1.tHelp1Uid', '=', 't_platform.uid');
                $join->on('tHelp1.tHelp1TipeLogger', '=', 't_platform.tipe_logger');
            });

            $query->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $query->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });
            $query->where('t_users_sites.user_id', '=', $userId);
            $query->where('t_users_sites.status_site', '=', 1);

            if ($heartbeatStatus) {
                if ($heartbeatStatus != 1) {
                    if ($heartbeatStatus == 2) {
                        $query->where('t_platform.status_platform', '=', 'online');
                    } else {
                        $query->where('t_platform.status_platform', '=', 'offline');
                    }
                }
            }

            if ($search != '') {
                $query->where(function ($query) use ($search) {
                    $query->where('uid', 'LIKE', '%' . $search . '%');
                    $query->orWhereHas('site', function ($qHas) use ($search) {
                        $qHas->where('nama_site', 'LIKE', '%' . $search . '%');
                    });
                    $query->orWhereHas('site.customer', function ($qHas) use ($search) {
                        $qHas->where('nama_perusahaan', 'LIKE', '%' . $search . '%');
                    });
                });
            }

            if ($uid) {
                $query->where('t_platform.uid', '=', $uid);
            }

            $query->orderBy('last_online', 'DESC');
            $query->orderBy('t_platform.tipe_logger');
            $query->groupBy('t_platform.uid');
        }

        public function scopeEnviroPlatformBySearchGrouped(Builder $query, $userId, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'] ?? [];
            }

            $query->select('*')->fromSub(function ($subQuery) use ($userId, $search) {
                $subQuery->select([
                    't_platform.*',
                    DB::raw('COUNT(*) as total_logger')
                ]);
                $subQuery->from('t_platform')
                    ->leftJoin(DB::raw('
                        (
                            SELECT
                                t_parameter.uid as tHelp1Uid,
                                t_parameter.tipe_logger as tHelp1TipeLogger,
                                MAX(t_parameter.datetime_unix) as last_online
                            FROM t_parameter
                            GROUP BY t_parameter.uid, t_parameter.tipe_logger
                        ) tHelp1
                    '), function ($join) {
                        $join->on('tHelp1.tHelp1Uid', '=', 't_platform.uid');
                        $join->on('tHelp1.tHelp1TipeLogger', '=', 't_platform.tipe_logger');
                    });
                $subQuery->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                $subQuery->join('t_users_sites_tipe_logger', function ($join) {
                    $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                    $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                    $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
                });
                $subQuery->where('t_users_sites.user_id', '=', $userId);
                $subQuery->where('t_users_sites.status_site', '=', 1);

                $subQuery->groupBy('t_platform.uid');
            }, 't_platform');

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $query->whereHas('site', function ($q) use ($search) {
                    $q->where('customer_lokasi_id', '=', $search['customer_lokasi_id']);
                });
            }

            if (isset($search['status_platform'])) {
                $query->where('t_platform.status_platform', '=', $search['status_platform']);
            }

            if (isset($search['uid'])) {
                $query->where('t_platform.uid', '=', $search['uid']);
            }
        }

        public function scopePlatformByLimit(Builder $builder, $userId, $options = []): void {
            $orderBy = [];
            $search = [];
            if (count($options) != 0) {
                $orderBy = $options['orderBy'] ?? [];
                $search = $options['search'] ?? [];
            }

            $builder->distinct();
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp1Uid,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid
                ) tHelp1
            '), 'tHelp1.tHelp1Uid', '=', 't_platform.uid');

            // $builder->where('status_validasi', 'Active');
            $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $builder->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });

            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $builder->whereHas('site', function ($q) use ($search) {
                    $q->where('customer_lokasi_id', '=', $search['customer_lokasi_id']);
                });
            }

            if (isset($search['tipe_logger']) && $search['tipe_logger'] != '') {
                $builder->where('t_platform.tipe_logger', '=', $search['tipe_logger']);
            }

            if (isset($search['status_platform']) && $search['status_platform'] != '') {
                $builder->where('t_platform.status_platform', '=', $search['status_platform'] == 1 ? 'online' : 'offline');
            }

            if (count($orderBy) !== 0) {
                foreach ($orderBy as $key => $value) {
                    if ($key == 'last_online') {
                        $builder->orderBy('last_online', $value);
                    }
                }
            } else {
                $builder->orderBy('uid');
                $builder->orderBy('t_platform.tipe_logger');
                $builder->orderBy('status_validasi');
            }
        }

        public function scopePlatformComboByLimit(Builder $builder, $userId): void {
            $builder->distinct();
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid as tHelp1Uid,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid
                ) tHelp1
            '), 'tHelp1.tHelp1Uid', '=', 't_platform.uid');

            $builder->where('status_validasi', 'Active');
            $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $builder->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });
            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);

            $builder->orderBy('uid');
            $builder->orderBy('t_platform.tipe_logger');
            $builder->orderBy('status_validasi');
        }

        public function scopePlatformMarker(Builder $builder, $userId): void {

            $builder->distinct();
            $builder->select(
                't_platform.*',
                DB::raw('COUNT(*) as total_logger')
            );
            // $builder->where('status_validasi', 'Active');
            $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $builder->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });
            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);

            $builder->groupBy('t_platform.site_id');
        }

        public function scopeDataPlatformHasilUkur(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->where('tipe_logger', '=', 2);
            $builder->where('status_validasi', '=', 'Active');

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $builder->whereHas('site', function ($q) use ($search) {
                    $q->where('customer_lokasi_id', '=', $search['customer_lokasi_id']);
                });
            }
        }

    }
