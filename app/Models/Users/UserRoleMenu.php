<?php

    namespace App\Models\Users;

    use App\Models\Menu;
    use Auth;
    use DB;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class UserRoleMenu extends Model {
        protected $table = 't_users_role_menu';
        protected $fillable = [
            'role_id',
            'menu_id',
            'features',
            'role_status'
        ];

        public function menu(): BelongsTo {
            return $this->belongsTo(Menu::class, 'menu_id', 'id');
        }

        public function scopeDataMenu(Builder $builder, $parentId): void {

            $builder->select(
                't_menu.id',
                't_menu.menu_name',
                't_menu.route',
                't_menu.segment',
                't_menu.icon',
                't_users_role_menu.features',
                DB::raw('COALESCE(t_child.count_child, 0) AS count_child')
            );

            $builder->leftJoin('t_menu', 't_users_role_menu.menu_id', '=', 't_menu.id');
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        COUNT(*) AS count_child,
                        t_menu.parent_id
                    FROM t_menu
                    GROUP BY t_menu.parent_id
                ) as t_child
            '), 't_menu.id', '=', 't_child.parent_id');

            $builder->where('t_users_role_menu.role_id', Auth::user()->role_id);
            $builder->where('t_users_role_menu.role_status', '=', 1);
            $builder->where('t_menu.parent_id', $parentId);
            $builder->where('t_menu.flag_active', '=', 1);
            $builder->orderBy('t_menu.sorting');

        }

        public function scopeRoleAccess(Builder $builder, $segment): void {
            $builder->where('t_users_role_menu.role_id', Auth::user()->role_id);
            $builder->whereHas('menu', function ($builder) use ($segment) {
                $builder->where('segment', $segment);
            });
        }

        public function scopeRoleAccessByUserId(Builder $builder, $userId, $segment): void {
            $builder->where('t_users_role_menu.role_id', $userId);
            $builder->whereHas('menu', function ($builder) use ($segment) {
                $builder->where('segment', $segment);
            });
        }

    }
