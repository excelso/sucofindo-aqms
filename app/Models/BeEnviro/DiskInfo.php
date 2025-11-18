<?php

    namespace App\Models\BeEnviro;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Notifications\Notifiable;

    class DiskInfo extends Model {
        use Notifiable;

        protected $table = 't_disk_info';
        protected $fillable = [
            'server_name',
            'server_ip',
            'disk_free',
            'disk_total',
            'disk_used',
            'disk_used_percent',
        ];
    }
