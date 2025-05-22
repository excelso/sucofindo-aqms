<?php

    namespace App\Models\Users;

    // use Illuminate\Contracts\Auth\MustVerifyEmail;
    use App\Models\Companies\Companies;
    use App\Models\Employee\EmployeeAllowance;
    use App\Models\Employee\Employee;
    use App\Models\Employee\EmployeeRollingShift;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable {
        use HasFactory, Notifiable;

        protected $table = 't_users';
        protected $fillable = [
            'user_uniq_id',
            'tipe_user',
            'sid_code',
            'nama_lengkap',
            'email',
            'password',
            'remember_token',
            'current_fcm_token',
            'user_level',
            'is_customer',
            'customer_id',
            'last_login',
            'status_user',
            'init_master',
            'is_showing',
            'deleted_at',
        ];

        protected $hidden = [
            'password',
            'remember_token',
        ];

        protected function casts(): array {
            return [
                'email_verified_at' => 'datetime',
                'password' => 'hashed',
            ];
        }
    }
