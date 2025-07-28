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
    use Illuminate\Support\Collection;
    use LaravelIdea\Helper\App\Models\Master\_IH_PlatformsHeartbeat_QB;

    class PlatformsHeartbeat extends Model {

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_platforms_heartbeat';
        protected $fillable = [
            'uid',
            'heartbeat_status',
        ];

        public function dataPlatformsHeartbeat($uid) {
            $query = "
                SELECT
                    uid,
                    heartbeat_status,
                    updated_at,
                    gap_days,
                    gap_hours,
                    gap_minutes,
                    gap_seconds,
                    gap_readable,
                    prev_datetime_unix
                FROM (
                    SELECT
                        summary.uid,
                        summary.heartbeat_status,
                        summary.updated_at,
                        summary.gap_days,
                        summary.gap_hours,
                        summary.gap_minutes,
                        summary.gap_seconds,
                        summary.gap_readable,
                        summary.prev_datetime_unix
                    FROM
                        (
                            SELECT
                                uid,
                                heartbeat_status,
                                updated_at,
                                @prev_time AS prev_datetime_unix,
                                IF(@prev_time IS NOT NULL, (UNIX_TIMESTAMP(updated_at) - @prev_time), 0) AS gap_seconds_total,

                                -- Kolom hari
                                IF(@prev_time IS NULL, 0,
                                   FLOOR((UNIX_TIMESTAMP(updated_at) - @prev_time) / 86400)
                                ) AS gap_days,

                                -- Kolom jam (sisa setelah dikurangi hari)
                                IF(@prev_time IS NULL, 0,
                                   FLOOR(((UNIX_TIMESTAMP(updated_at) - @prev_time) % 86400) / 3600)
                                ) AS gap_hours,

                                -- Kolom menit (sisa setelah dikurangi hari dan jam)
                                IF(@prev_time IS NULL, 0,
                                   FLOOR(((UNIX_TIMESTAMP(updated_at) - @prev_time) % 3600) / 60)
                                ) AS gap_minutes,

                                -- Kolom detik (sisa terakhir)
                                IF(@prev_time IS NULL, 0,
                                   (UNIX_TIMESTAMP(updated_at) - @prev_time) % 60
                                ) AS gap_seconds,

                                CASE
                                    WHEN @prev_time IS NULL THEN '-'
                                    WHEN (UNIX_TIMESTAMP(updated_at) - @prev_time) >= 86400 THEN
                                        CONCAT(FLOOR((UNIX_TIMESTAMP(updated_at) - @prev_time) / 86400), ' hari')
                                    WHEN (UNIX_TIMESTAMP(updated_at) - @prev_time) >= 3600 THEN
                                        CONCAT(FLOOR((UNIX_TIMESTAMP(updated_at) - @prev_time) / 3600), ' jam')
                                    WHEN (UNIX_TIMESTAMP(updated_at) - @prev_time) >= 60 THEN
                                        CONCAT(FLOOR((UNIX_TIMESTAMP(updated_at) - @prev_time) / 60), ' menit')
                                    ELSE
                                        CONCAT((UNIX_TIMESTAMP(updated_at) - @prev_time), ' detik')
                                END AS gap_readable,

                                @prev_time := UNIX_TIMESTAMP(updated_at)
                            FROM
                                t_platforms_heartbeat,
                                (
                                    SELECT @prev_time := NULL
                                ) vars
                            WHERE uid = ?
                            ORDER BY updated_at ASC
                        ) AS summary
                    ORDER BY summary.updated_at ASC
                ) AS final_result
                ORDER BY updated_at DESC;
            ";

            // Karena menggunakan MySQL variables, kita pakai DB::select
            return collect(DB::select($query, [$uid]));
        }

        public static function getHeartbeatWithGap($uid): _IH_PlatformsHeartbeat_QB|Collection {
            return (new static)->dataPlatformsHeartbeat($uid);
        }
    }
