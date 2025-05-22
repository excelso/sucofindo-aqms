<?php

    namespace App\Models\Users;

    use Auth;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class UserRole extends Model {
        use SoftDeletes;

        protected $table = 't_users_role';
        protected $fillable = [
            'role_name',
            'role_menu_permission'
        ];

        public function roleMenu(): HasMany {
            return $this->hasMany(UserRoleMenu::class, 'role_id', 'id');
        }

        public function scopeDataUserRole(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) $search = $options['search'];

            if (isset($search['role-name']) && $search['role-name'] != '') {
                $builder->where('role_name', 'LIKE', '%' . $search['role-name'] . '%');
            }
            if (isset($search['role-menu-permission']) && $search['role-menu-permission'] != '') {
                $builder->where('role_menu_permission', '=', $search['role-menu-permission']);
            }

            if (isset($search['sort']) && $search['sort'] != '') {
                $dataSorts = explode(',', $search['sort']);
                foreach ($dataSorts as $item) {
                    $dataSort = explode('|', $item);
                    $builder->orderBy($dataSort[0], $dataSort[1]);
                }
            }
        }

        public function scopeDataUserRoleExBox(Builder $builder): void {
            if (Auth::user()->role->init_master == 0) {
                $builder->where('init_master', '=', 0);
            }
        }

    }
