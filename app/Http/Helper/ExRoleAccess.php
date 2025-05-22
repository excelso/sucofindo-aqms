<?php

    namespace App\Http\Helper;

    use App\Models\Users\UserRoleMenu;

    class ExRoleAccess {
        public static function roleAccess($segment): array {
            $dataRoleAccess = UserRoleMenu::roleAccess($segment)->first();
            $features = [];
            if ($dataRoleAccess) {
                $dataFeatures = json_decode($dataRoleAccess->features, true);
                foreach ($dataFeatures as $item) {
                    $features[$item['type']] = $item['checked'];
                }
            }

            return $features;
        }

        public static function roleAccessByUserId($userId, $segment): array {
            $dataRoleAccess = UserRoleMenu::roleAccessByUserId($userId, $segment)->first();
            $features = [];
            if ($dataRoleAccess) {
                $dataFeatures = json_decode($dataRoleAccess->features, true);
                foreach ($dataFeatures as $item) {
                    $features[$item['type']] = $item['checked'];
                }
            }

            return $features;
        }
    }
