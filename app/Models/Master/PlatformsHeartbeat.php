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
            'error_message',
            'datetime_unix',
        ];

        public function scopePlatformsHeartbeat(Builder $builder, $uid, $startDate, $untilDate, $timezone, $filterStatus = null): void {
            $builder->select([
                'uid',
                'heartbeat_status',
            ]);
            $builder->selectRaw("CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'UTC', ?) AS date_formated", [$timezone]);

            $builder->whereRaw("CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'UTC', ?) BETWEEN ? AND ?", [$timezone, $startDate, $untilDate]);
            $builder->where('uid', $uid);
            if ($filterStatus) {
                if ($filterStatus != 'All') {
                    $builder->where('heartbeat_status', $filterStatus);
                }
            }
            $builder->orderBy('date_formated', 'DESC');
        }
    }
