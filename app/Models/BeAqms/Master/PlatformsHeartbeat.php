<?php

    namespace App\Models\BeAqms\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;

    class PlatformsHeartbeat extends Model {

        protected $connection = 'aqms-mysql';
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
