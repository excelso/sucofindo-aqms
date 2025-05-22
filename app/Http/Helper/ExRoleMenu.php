<?php

    namespace App\Http\Helper;

    use App\Models\Menu;
    use App\Models\Users\UserRoleMenu;
    use Illuminate\Support\Facades\Config;

    class ExRoleMenu {

        public static function roleMenu($menuUsed): string {
            return (new ExRoleMenu)->roleMenuConfig(0, $menuUsed);
        }

        public function roleMenuConfig($parentId, $menuUsed): string {
            $dataMenu = Menu::menu($parentId, $menuUsed)->get();

            $menus = '';
            foreach ($dataMenu as $item) {
                $menus .= '<li class="ex-menu-item">';
                if (isset($item->count_child) && $item->count_child > 0) {
                    $menus .= '
                        <div class="ex-menu-link">
                            <span class="ex-menu-arrow">
                                <i class="fas fa-caret-right"></i>
                            </span>
                            <label for="' . $item->id . '" class="font-bold">' . $item->menu_name . '</label>
                            <div>
                                <input type="checkbox" id="' . $item->id . '" data-parent="true" value="' . $item->id . '">
                            </div>
                        </div>
                    ';

                    $menus .= '<ul class="ex-menu-tree ex-menu-show">';
                    $menus .= $this->roleMenuConfig($item->id, $menuUsed);
                    $menus .= '</ul>';
                } else {

                    $feature = '';
                    if ($item->features) {
                        $dataFeature = json_decode($item->features, false);
                        foreach ($dataFeature as $itemFeature) {
                            $feature .= '
                            <li class="ex-menu-item">
                                <div class="ex-menu-link">
                                    <label for="' . $itemFeature->feature_module . '_' . $itemFeature->feature_type . '">' . $itemFeature->feature_name . '</label>
                                    <div>
                                        <input type="checkbox" id="' . $itemFeature->feature_module . '_' . $itemFeature->feature_type . '" data-feature="true" data-parent-id="' . $item->id . '" data-module="' . $itemFeature->feature_module . '" value="' . $itemFeature->feature_type . '">
                                    </div>
                                </div>
                            </li>
                        ';
                        }
                    }

                    $menus .= '
                        <div class="ex-menu-link">
                            <span class="ex-menu-arrow">
                                <i class="fas fa-caret-right"></i>
                            </span>
                            <label for="' . $item->id . '" class="font-bold">' . $item->menu_name . '</label>
                            <div>
                                <input type="checkbox" id="' . $item->id . '" data-parent="true" value="' . $item->id . '">
                            </div>
                        </div>
                        <ul class="ex-menu-tree">
                            ' . $feature . '
                        </ul>
                    ';
                }

                $menus .= '</li>';
            }

            return $menus;
        }

        public static function sidebarMenu(): string {
            return (new ExRoleMenu)->sidebarMenuConfig(0);
        }

        public function sidebarMenuConfig($parentId): string {
            $dataMenu = UserRoleMenu::dataMenu($parentId)->get();

            $menus = '';
            foreach ($dataMenu as $item) {
                if (isset($item->count_child) && $item->count_child > 0) {

                    $naviActive = '';
                    $linkActive = '';
                    if (count(request()->segments()) != 0 && isset($item->segment) && in_array($item->segment, request()->segments())) {
                        $naviActive = 'mm-active';
                        $linkActive = 'navLinkActive';
                    }

                    $menus .= '<li class="navItem ' . $naviActive . '">';

                    $textIcon = '
                        <div class="navText">
                            <p>' . $item->menu_name . '</p>
                        </div>
                    ';

                    if ($item['icon'] != null) {
                        $textIcon = '
                            <div class="flex items-center justify-start">
                                <div class="navIcon">
                                    <i class="' . $item->icon . '"></i>
                                </div>
                                <div class="navText">
                                    <p>' . $item->menu_name . '</p>
                                </div>
                            </div>
                        ';
                    }

                    $menus .= '
                        <a class="navLink ' . $linkActive . '">
                            ' . $textIcon . '
                            <div class="navArrowDown">
                                <i class="fa fa-caret-right"></i>
                            </div>
                        </a>
                    ';

                    $menus .= '<ul class="navTreeview">';
                    $menus .= $this->sidebarMenuConfig($item->id);
                    $menus .= '</ul>';
                } else {
                    $menus .= '<li class="navItem">';

                    $url = '';
                    if ($item->route != null) {
                        $url = 'href="' . route($item->route) . '"';
                    }

                    $textIcon = '
                        <div class="navText">
                            <p>' . $item->menu_name . '</p>
                        </div>
                    ';

                    if ($item->icon != null) {
                        $textIcon = '
                            <div class="flex items-center justify-start">
                                <div class="navIcon">
                                    <i class="' . $item->icon . '"></i>
                                </div>
                                <div class="navText">
                                    <p>' . $item->menu_name . '</p>
                                </div>
                            </div>
                        ';
                    }

                    $linkActive = '';
                    if (count(request()->segments()) != 0 && isset($item->segment) && in_array($item->segment, request()->segments())) {
                        $linkActive = 'navLinkActive';
                    }

                    $menus .= '
                        <a class="navLink ' . $linkActive . '" ' . $url . '>
                            ' . $textIcon . '
                        </a>
                    ';
                }
                $menus .= '</li>';
            }

            return $menus;
        }
    }
