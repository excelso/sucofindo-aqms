<?php

    namespace App\Models\Users;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;

    class UserFirebase extends Model {

        protected $guarded = [];
        protected $table = 't_users_fcm';

        public function scopeUserFCMTokenByUserLevel(Builder $builder, $userLevel): void {
            $builder->select(
                't_users_fcm.*',
                't_users.user_uniq_id'
            );
            $builder->leftJoin('t_users', 't_users_fcm.user_id', '=', 't_users.id');
            $builder->where('t_users_fcm.user_status', 'login');
            $builder->where('t_users.user_level', $userLevel);
        }
    }
