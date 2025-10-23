<?php

    namespace App\Models\BeSparing\Master;

    use Auth;
    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
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

        public function scopePlatformBySearch(Builder $builder, $userId, $search = ''): void {
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

            // $builder->where('status_validasi', 'Active');
            if (request()->user()->user_level != 'super_admin') {
                $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                $builder->join('t_users_sites_tipe_logger', function ($join) {
                    $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                    $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                });
                $builder->where('t_users_sites.user_id', '=', $userId);
                $builder->where('t_users_sites.status_site', '=', 1);
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

            $builder->where('status_validasi', 'Active');
            if (request()->user()->user_level != 'super_admin') {
                $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                // $builder->join('t_users_sites_tipe_logger', function ($join) {
                //     $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                //     $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                // });
                $builder->where('t_users_sites.user_id', '=', $userId);
                $builder->where('t_users_sites.status_site', '=', 1);
            }

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $builder->whereHas('site', function ($q) use ($search) {
                    $q->where('customer_lokasi_id', '=', $search['customer_lokasi_id']);
                });
            }

            if (isset($search['tipe_logger']) && $search['tipe_logger'] != '') {
                $builder->where('t_platform.tipe_logger', '=', $search['tipe_logger']);
            } else {
                $builder->where('t_platform.tipe_logger', '=', 1);
            }

            if (isset($search['status_platform']) && $search['status_platform'] != '') {
                $builder->where('t_platform.status_platform', '=', $search['status_platform'] == 1 ? 'online' : 'offline');
            }

            if (count($orderBy) !== 0) {
                foreach ($orderBy as $key => $value) {
                    if ($key == 'last_online') {
                        $builder->orderBy('last_online', $value);
                        // $builder->orderBy('tipe_logger');
                    }
                }
            } else {
                $builder->orderBy('uid');
                $builder->orderBy('t_platform.tipe_logger');
                $builder->orderBy('status_validasi');
            }
        }

        public function scopePlatformComboByLimit(Builder $builder): void {
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
            if (request()->user()->user_level != 'super_admin') {
                $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                $builder->join('t_users_sites_tipe_logger', function ($join) {
                    $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                    $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                });
                $builder->where('t_users_sites.user_id', '=', Auth::user()->id);
                $builder->where('t_users_sites.status_site', '=', 1);
            }

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
            if (request()->user()->user_level != 'super_admin') {
                $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
                $builder->join('t_users_sites_tipe_logger', function ($join) {
                    $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                    $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                });
                $builder->where('t_users_sites.user_id', '=', $userId);
                $builder->where('t_users_sites.status_site', '=', 1);
            }

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
