<?php

    return [
        'paths' => ['api/*', 'sanctum/csrf-cookie'],

        'allowed_methods' => ['*'],

        'allowed_origins' => [
            'http://localhost:3000',
            'http://aqms-logger.beraucoal.co.id',
            'https://beenviro.beraucoal.co.id',
        ],

        'allowed_origins_patterns' => [],

        'allowed_headers' => ['*'],

        'exposed_headers' => [],

        'max_age' => 0,

        'supports_credentials' => true,
    ];
