<?php

    namespace App\Models\Users;

    use App\Models\BeAqms\Master\Companies;
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

        public function scopeDataUsers(Builder $builder, $options = []): void {
            $builder->select('*');
        }

        public function scopeDataUserById(Builder $builder, $userId): void {
            $builder->where('id', $userId);
        }
    }
