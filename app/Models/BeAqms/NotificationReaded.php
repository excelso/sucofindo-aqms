<?php

    namespace App\Models\BeAqms;

    use Illuminate\Database\Eloquent\Model;

    class NotificationReaded extends Model {

        protected $connection = 'aqms-mysql';
        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_notification_readed';
        protected $fillable = [
            'notification_id',
            'user_id',
            'readed',
        ];

    }
