<?php

    namespace App\Models;

    use App\Models\Users\UserRoleMenu;
    use DB;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;

    class Menu extends Model {
        protected $table = 't_menu';

        public function scopeMenu(Builder $builder, $parentId, array $menUsed): void {
            $builder->select(
                't_menu.id',
                't_menu.menu_name',
                't_menu.features',
                't_menu.icon',
                DB::raw('COALESCE(t_child.count_child, 0) AS count_child')
            );

            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        COUNT(*) AS count_child,
                        t_menu.parent_id
                    FROM t_menu
                    GROUP BY t_menu.parent_id
                ) as t_child
            '), 't_menu.id', '=', 't_child.parent_id');

            $builder->where('t_menu.parent_id', $parentId);
            $builder->where('t_menu.flag_active', '=', 1);
            $builder->whereIn('t_menu.menu_used', $menUsed);
            $builder->orderBy('t_menu.sorting');
        }
    }
