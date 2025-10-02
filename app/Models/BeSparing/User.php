<?php

    namespace App\Models\BeSparing;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model {
        protected $connection = 'sparing-mysql';
        protected $table = 't_users';

        protected $fillable = [
            'user_uniq_id',
            'tipe_user',
            'sid_code',
            'nama_lengkap',
            'email',
            'password',
            'user_level',
            'department',
            'is_customer',
            'customer_id',
            'status_user',
            'init_master',
            'is_showing',
        ];

        public function fcmTokens() {
            return $this->hasMany(UserFcm::class, 'user_id');
        }

        public function sites() {
            return $this->hasMany(UserSite::class, 'user_id');
        }
    }
