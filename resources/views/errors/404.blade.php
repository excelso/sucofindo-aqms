<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
    <title>404 | Not Found</title>
    <link rel="shortcut icon" href="{{asset('/images/favicon.png')}}"/>
    @vite(['resources/css/app.scss'])
</head>
<body>
    <div class="bg-gray-100 h-screen flex items-center justify-center">
        <div>
            <img src="{{ asset('images/vector/vector-404.png') }}" width="400" alt="">
        </div>
        <div>
            <div class="text-gray-500 text-[29px]">Oppss!</div>
            @if($exception->getMessage())
                <div class="text-gray-500 text-xl">{{ $exception->getMessage() }}</div>
            @elseif(isset($message))
                <div class="text-gray-500 text-xl">{{ $message }}</div>
            @else
                <div class="text-gray-500 text-xl">{{ __('Page not found!') }}</div>
            @endif
            <a class="ds-btn ds-btn-outline ds-btn-primary normal-case mt-3" href="{{ url('/') }}">
                Kembali
            </a>
        </div>
    </div>
</body>
</html>
