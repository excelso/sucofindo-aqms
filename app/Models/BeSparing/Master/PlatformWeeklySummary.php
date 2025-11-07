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

    class PlatformWeeklySummary extends Model {
        use Compoships, SoftDeletes;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_platform_weekly_summary';

        public function platform(): RelationsBelongsTo|BelongsTo {
            return $this->belongsTo(Platform::class, 'uid', 'uid');
        }

        public function scopeDataWeekly(Builder $builder, string $minDate, string $maxDate, $userId, $siteLokasiId = null, $tipeLogger = null): void {
            $builder->select('t_platform_weekly_summary.*');
            $builder->whereDate('t_platform_weekly_summary.week_start', '=', $minDate);
            $builder->whereDate('t_platform_weekly_summary.week_until', '=', $maxDate);

            $builder->join('t_platform', 't_platform_weekly_summary.uid', '=', 't_platform.uid');
            $builder->leftJoin('t_customer_site', 't_platform.site_id', '=', 't_customer_site.id');
            $builder->leftJoin('t_customer_lokasi', 't_customer_site.customer_lokasi_id', '=', 't_customer_lokasi.id');

            $builder->join('t_users_sites', 't_platform.site_id', '=', 't_users_sites.site_id');
            $builder->join('t_users_sites_tipe_logger', function ($join) {
                $join->on('t_users_sites.id', '=', 't_users_sites_tipe_logger.users_sites_id');
                $join->on('t_platform.tipe_logger', '=', 't_users_sites_tipe_logger.tipe_logger');
                $join->where('t_users_sites_tipe_logger.is_active', '=', 1);
            });

            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);

            if ($siteLokasiId) {
                $builder->where('t_customer_site.customer_lokasi_id', $siteLokasiId);
            }

            if ($tipeLogger) {
                $builder->where('t_platform_weekly_summary.tipe_logger', '=', $tipeLogger);
            }
        }

    }
