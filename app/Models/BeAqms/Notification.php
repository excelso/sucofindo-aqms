<?php

namespace App\Models;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class Notification extends Model {

    protected $connection = 'aqms-mysql';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 't_notification';
    protected $fillable = [
        'title',
        'message',
        'link',
        'data_notif',
        'sender_id',
        'receiver_id',
        'module',
        'categories',
        'sent_status',
    ];


    public function senderId(): BelongsTo {
        return $this->belongsTo(User::class, 'sender_id', 'id');
    }

    public function scopeDataCountNotification(Builder $builder, $userId): void {
        $builder->select('t_notification.*');
        $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_notification_readed.*
                    FROM
                        t_notification_readed
                        WHERE t_notification_readed.user_id = "' . $userId . '"
                ) as notifikasi_read
            '), 'notifikasi_read.notification_id', '=', 't_notification.id');

        $builder->where(function ($query) use ($userId) {
            $query->where('t_notification.receiver_id', $userId);
            $query->orWhereNull('t_notification.receiver_id');
        });
        $builder->whereNull('notifikasi_read.user_id');
        $builder->where('t_notification.sent_status', '=', 'sent');
    }

    public function scopeDataNotification(Builder $builder, $userId, $options = []): void {
        $search = [];
        if (count($options) != 0) {
            $search = $options['search'];
        }

        $builder->select(
            't_notification.*',
            'notifikasi_read.readed',
        );

        $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_notification_readed.*
                FROM
                    t_notification_readed
                    WHERE t_notification_readed.user_id = "' . $userId . '"
            ) as notifikasi_read
        '), 'notifikasi_read.notification_id', '=', 't_notification.id');

        if (isset($search['categories']) && $search['categories'] != '') {
            if ($search['categories'] != 'all') {
                $builder->where('t_notification.categories', '=', $search['categories']);
            }
        }

        $builder->where(function ($query) use ($userId) {
            $query->where('t_notification.receiver_id', $userId);
            $query->orWhereNull('t_notification.receiver_id');
        });
        $builder->where('t_notification.sent_status', '=', 'sent');
        $builder->orderBy('t_notification.created_at', 'DESC');
    }

}
