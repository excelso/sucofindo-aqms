<?php

    namespace App\Models\Users;

    use Auth;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class UserPlatforms extends Model {

        protected $connection = 'aqms-mysql';
        protected $table = 't_users_platforms';
        protected $fillable = [
            'user_id',
            'platform_id',
            'type_logger',
            'is_active',
        ];

        public function scopeUserPlatforms(Builder $builder, $user_id): void {
            $builder->select([
                't_users_platforms.platform_id'
            ]);
            $builder->where('user_id', $user_id);
            $builder->where('is_active', '=', 1);
            $builder->groupBy(['platform_id']);
        }

    }
