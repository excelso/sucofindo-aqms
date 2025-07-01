<?php

    namespace App\Models\Users;

    use Auth;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class UserPlatforms extends Model {

        protected $table = 't_users_platforms';
        protected $fillable = [
            'user_id',
            'platform_id',
            'type_logger',
            'is_active',
        ];

    }
