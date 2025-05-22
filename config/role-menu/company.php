<?php

    return [
        [
            'id' => 'm_hrd',
            'menu_name' => 'Human Resource',
            'type_menu' => 'company',
            'sub_menus' => [
                [
                    'id' => 'm_employee',
                    'parent_id' => 'm_hrd',
                    'menu_name' => 'Employee',
                    'type_menu' => 'company',
                    'sub_menus' => [
                        [
                            'id' => 'm_employee_view',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'View Module',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_employee_create',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'Create New Employee',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_employee_view_detail',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'View Detail',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_employee_delete',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'Delete',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_employee_update',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'Update',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_employee_export',
                            'parent_id' => 'm_employee',
                            'menu_name' => 'Export Data',
                            'type' => 'features',
                        ],
                    ]
                ]
            ]
        ],
        [
            'id' => 'm_master',
            'menu_name' => 'Master',
            'sub_menus' => [
                [
                    'id' => 'm_bank',
                    'parent_id' => 'm_master',
                    'menu_name' => 'Bank',
                    'sub_menus' => [
                        [
                            'id' => 'm_bank_view',
                            'parent_id' => 'm_bank',
                            'menu_name' => 'View Module',
                            'type' => 'features',
                        ],
                        [
                            'id' => 'm_bank_create',
                            'parent_id' => 'm_bank',
                            'menu_name' => 'Create New Bank',
                            'type' => 'features',
                        ],
                    ],
                ],
            ],
        ]
    ];
