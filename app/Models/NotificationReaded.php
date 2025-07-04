<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\DB;

    class NotificationReaded extends Model {

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_notification_readed';
        protected $fillable = [
            'notification_id',
            'user_id',
            'readed',
        ];

    }
