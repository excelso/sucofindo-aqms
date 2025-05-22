<x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')"/>
    <div class="login">
        <div class="login-left-container">
            <div class="login-box">
                <div class="login-header">
                    <img src="{{url('/images/logo-color.png')}}" class="mx-auto w-[150px]" alt="Logo"/>
                    <div class="mt-7">
                        <div class="font-bold text-5xl">
                            Welcome Back
                        </div>
                        <div class="font-normal text-sm">
                            Please Login to your Account
                        </div>
                    </div>
                </div>

                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="login-body">
                        <div class="form-group">
                            <label> Username / Email </label>
                            <div class="form-group-control">
                                <span class="icon">
                                    <i class="far fa-envelope"></i>
                                </span>
                                <label>
                                    <input type="text" name="login" class="form-control input email" placeholder="name@mail.com"/>
                                </label>
                            </div>
                            @if(count($errors) != 0 && isset($errors->get('email')[0]))
                                <div class="info-alert-text error errorEmail">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <div class="errorEmailText">{{$errors->get('email')[0]}}</div>
                                </div>
                            @endif
                        </div>

                        <div class="form-group">
                            <label> Password </label>
                            <div class="form-group-control">
                                <span class="icon">
                                    <i class="fa fa-lock"></i>
                                </span>
                                <label>
                                    <input type="password" name="password" class="form-control passw" placeholder="··················"/>
                                </label>
                                <a class="show-pass btnLookPass">
                                    <i class="fas fa-eye-slash"></i>
                                </a>
                            </div>
                            @if(count($errors) != 0 && isset($errors->get('password')[0]))
                                <div class="info-alert-text error errorPassword">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <div class="errorPasswordText">{{$errors->get('password')[0]}}</div>
                                </div>
                            @endif
                        </div>
                    </div>

                    <div class="flex items-center justify-between mt-4">
                        <label for="remember_me" class="inline-flex items-center cursor-pointer">
                            <input id="remember_me" type="checkbox" class="rounded border-gray-300 text-primary shadow-sm focus:ring-primary" name="remember" checked>
                            <span class="ml-2 text-sm text-gray-600">{{ __('Remember me') }}</span>
                        </label>
                        <div class="inline-flex items-center">
                            <a href="{{ route('password.request') }}" class="text-[14px] hover:underline">Lupa Password?</a>
                        </div>
                    </div>

                    @if(count($errors) != 0 && $errors->first('login-failed') != '')
                        <div class="ds-alert ds-alert-error rounded-md mt-4">
                            <div class="text-white text-sm">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>{{ $errors->first('login-failed') }}</span>
                            </div>
                        </div>
                    @endif

                    <div class="mt-4">
                        <button type="submit" class="btn btn-primary w-full">Login</button>
                    </div>
                </form>

                <div class="login-footer">
                    <div>AQMS @2025</div>
                    <div>Powered By SUCOFINDO</div>
                </div>
            </div>
        </div>

        <div class="login-right-container">
            <div class="p-[40px]">
                 <div id="typewriter"></div>
                {{-- <img src="{{asset('images/bg.png')}}" alt="background" width="700"> --}}
            </div>
        </div>
    </div>
</x-guest-layout>

@vite(['resources/js/login/index.tsx'])
