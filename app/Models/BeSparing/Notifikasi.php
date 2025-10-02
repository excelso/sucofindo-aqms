<?php

namespace App\Models\BeSparing;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class Notifikasi extends Model {

    protected $connection = 'sparing-mysql';
    protected $guarded = [];
    protected $table = 't_notifikasi';

    public function senderId(): BelongsTo {
        return $this->belongsTo(User::class, 'sender_id', 'id');
    }

    public function scopeDataCountNotifikasi(Builder $builder, $userUniqId): void {
        $builder->select('t_notifikasi.*');
        $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_notifikasi_read.*
                    FROM
                        t_notifikasi_read
                        WHERE t_notifikasi_read.user_uniq_id = "' . $userUniqId . '"
                ) as notifikasi_read
            '), 'notifikasi_read.notifikasi_id', '=', 't_notifikasi.id');

        $builder->where(function ($query) use ($userUniqId) {
            $query->where('t_notifikasi.user_uniq_id', $userUniqId);
            $query->orWhereNull('t_notifikasi.user_uniq_id');
        });
        $builder->whereNull('notifikasi_read.user_uniq_id');
        $builder->where('t_notifikasi.status_kirim', '=', 'terkirim');
    }

    public function scopeDataNotifikasi(Builder $builder, $userUniqId, $options = []): void {
        $search = [];
        if (count($options) != 0) {
            $search = $options['search'];
        }

        $builder->select(
            't_notifikasi.*',
            'notifikasi_read.readed',
        );

        $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_notifikasi_read.*
                FROM
                    t_notifikasi_read
                    WHERE t_notifikasi_read.user_uniq_id = "' . $userUniqId . '"
            ) as notifikasi_read
        '), 'notifikasi_read.notifikasi_id', '=', 't_notifikasi.id');

        if (isset($search['kategori']) && $search['kategori'] != '') {
            if ($search['kategori'] != 'all') {
                $builder->where('t_notifikasi.kategori', '=', $search['kategori']);
            }
        }

        $builder->where(function ($query) use ($userUniqId) {
            $query->where('t_notifikasi.user_uniq_id', $userUniqId);
            $query->orWhereNull('t_notifikasi.user_uniq_id');
        });
        $builder->where('t_notifikasi.status_kirim', '=', 'terkirim');
        $builder->orderBy('t_notifikasi.created_at', 'DESC');
    }

}
