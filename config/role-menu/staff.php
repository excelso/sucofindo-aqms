<?php

    return [
        [
            'id' => 'm_settings',
            'menu_name' => 'Settings',
            'sub_menus' => [
                [
                    'id' => 'm_change_password',
                    'parent_id' => 'm_settings',
                    'menu_name' => 'Change Password',
                    'type' => 'features',
                ]
            ]
        ],
    ];
