<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="login-employee-id" content="{{ Auth::user()->id }}">

    <title>@yield('title') - {{ config('app.name', 'Laravel') }}</title>
    <link rel="shortcut icon" href="{{ asset('/images/favicon.png') }}?date={{ date('Hmi') }}"/>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet"/>

    <!-- Scripts -->
    @vite([
        'resources/css/app.scss',
        'resources/css/ex-autocomplete.scss',
        'resources/css/experiment-expicker.scss',
        'resources/css/experiment-exbox.scss',
        'resources/css/sweetalert-custom.css',
        'resources/css/tagify-custom.css',
        'resources/css/experiment-exmenu.scss',
        'resources/js/app.tsx'
    ])

    <link rel="stylesheet" href="{{ asset('js/plugins/select2/select2.css') }}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="{{ asset('js/plugins/metismenu/metisMenu.js') }}"></script>
    <script src="{{ asset('js/plugins/inputmask/jquery.inputmask.js') }}"></script>
    <script src="{{ asset('js/plugins/select2/select2.js') }}"></script>
</head>
<body>
    @include('layouts.header')
    @stack('script')
</body>
</html>
