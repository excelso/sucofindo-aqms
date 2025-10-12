<?php

    namespace App\Models\Users;

    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeSparing\Karyawan\UserSite;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;
    use Illuminate\Support\Str;

    class User extends Authenticatable {
        use HasFactory, Notifiable;

        protected $keyType = 'string';
        public $incrementing = false;

        protected $table = 't_users';
        protected $fillable = [
            'tipe_user',
            'sid_code',
            'nama_lengkap',
            'email',
            'password',
            'remember_token',
            'current_fcm_token',
            'user_level',
            'is_customer',
            'company_id',
            'last_login',
            'status_user',
            'init_master',
            'is_showing',
            'deleted_at',
            'id',
            'id_sparing',
        ];

        protected $hidden = [
            'password',
            'remember_token'
        ];

        protected function casts(): array {
            return [
                'email_verified_at' => 'datetime',
                'password' => 'hashed',
            ];
        }

        protected static function boot(): void {
            parent::boot();

            // ✅ Auto-generate UUID saat creating
            static::creating(function ($model) {
                if (empty($model->id)) {
                    $model->id = (string) Str::uuid();
                }
            });
        }

        public function companies(): BelongsTo {
            return $this->belongsTo(Companies::class, 'company_id', 'id');
        }

        public function userPlatforms(): User|Builder|HasMany {
            return $this->hasMany(UserPlatforms::class, 'user_id', 'id');
        }

        public function userSites(): User|Builder|HasMany {
            return $this->hasMany(UserSite::class, 'user_id', 'id_sparing');
        }

        public function scopeDataUsers(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->select('*');

            if (!empty($search['tipe_user'])) {
                $builder->where('tipe_user', '=', $search['tipe_user']);
            }

            if (!empty($search['full_name'])) {
                $builder->where('nama_lengkap', 'like', '%' . $search['full_name'] . '%');
            }

            if (!empty($search['email'])) {
                $builder->where('email', 'like', '%' . $search['email'] . '%');
            }

            if (!empty($search['role'])) {
                $builder->where('user_level', '=', $search['role']);
            }

            if (!empty($search['status'])) {
                $builder->where('status_user', '=', $search['status']);
            }

            $builder->orderBy('nama_lengkap');
        }

        public function scopeDataUserById(Builder $builder, $userId): void {
            $builder->where('id', $userId);
        }
    }
