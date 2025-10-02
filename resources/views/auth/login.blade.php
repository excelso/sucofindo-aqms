<x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')"/>
    <div class="login">
        <div class="login-left-container">
            <div class="login-box flex-col justify-center">
                <div class="login-header">
                    <img src="{{url('/images/logo-enviro1.png')}}" class="mx-auto w-[250px]" alt="Logo"/>
                    <div class="mt-7 !hidden">
                        <div class="font-bold text-5xl">
                            BeAQMS
                        </div>
                        <div class="font-normal text-sm">
                            Welcome Back, Please Login to your Account
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
                                    <input type="text" name="email" class="form-control input email" placeholder="name@mail.com"/>
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

                    <div class="items-center justify-between mt-4 !hidden">
                        <label for="remember_me" class="inline-flex items-center cursor-pointer">
                            <input id="remember_me" type="checkbox" class="rounded border-gray-300 text-primary shadow-sm focus:ring-primary" name="remember">
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
                    <div>Be Enviro @2025</div>
                    <div>Powered By PT. Berau Coal</div>
                </div>
            </div>
        </div>

        <div class="login-right-container">
            <div id="carousel" class="tw-carousel">
                <!-- Carousel wrapper -->
                <div class="tw-carousel-body">
                    <div id="carousel-item-1" class="tw-carousel-item hidden duration-700 ease-in-out">
                        <img src="{{ url('/images/banner/02.jpg') }}" alt="..."/>
                        <div class="absolute p-5 bg-black/[.6] left-0 right-0 bottom-0 h-[200px]">
                            <div class="text-white font-bold text-[28px]">Better Energy, Brighter Future</div>
                            <div class="text-white text-[20px] text-justify leading-[25px]">Enabling a brighter future through becoming an exponential energy transformer.</div>
                        </div>
                    </div>
                    <div id="carousel-item-2" class="tw-carousel-item hidden duration-700 ease-in-out">
                        <img src="{{ url('/images/banner/01.jpg') }}" alt="..."/>
                        <div class="absolute p-5 bg-black/[.6] left-0 right-0 bottom-0 h-[200px]">
                            <div class="text-white font-bold text-[28px]">Progressive</div>
                            <div class="text-white text-[20px] text-justify leading-[25px]">We believe in the principal of mutual advantage and build productive relationships with each other, our partners and our costumers.</div>
                        </div>
                    </div>
                    <div id="carousel-item-3" class="tw-carousel-item hidden duration-700 ease-in-out">
                        <img src="{{ url('/images/banner/04.jpg') }}" alt="..."/>
                        <div class="absolute p-5 bg-black/[.6] left-0 right-0 bottom-0 h-[200px]">
                            <div class="text-white font-bold text-[28px]">Trust</div>
                            <div class="text-white text-[20px] text-justify leading-[25px]">We deliver on our promises through continuous improvement, safe and reliable.</div>
                        </div>
                    </div>
                </div>
                <!-- Slider indicators -->
                <div class="tw-carousel-indicator">
                    <button id="carousel-indicator-1" type="button" class="tw-carousel-indicator-item" aria-current="true" aria-label="Slide 1"></button>
                    <button id="carousel-indicator-2" type="button" class="tw-carousel-indicator-item" aria-current="true" aria-label="Slide 1"></button>
                    <button id="carousel-indicator-3" type="button" class="tw-carousel-indicator-item" aria-current="true" aria-label="Slide 1"></button>
                </div>
                <!-- Slider controls -->
                <button id="data-carousel-prev" type="button" class="group absolute left-0 top-0 z-30 flex h-full cursor-pointer items-center justify-center px-4 focus:outline-none">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 group-hover:bg-white/50 group-focus:outline-none group-focus:ring-4 group-focus:ring-white dark:bg-gray-800/30 dark:group-hover:bg-gray-800/60 dark:group-focus:ring-gray-800/70">
                        <svg class="h-4 w-4 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
                        </svg>
                        <span class="hidden">Previous</span>
                    </span>
                </button>
                <button id="data-carousel-next" type="button" class="group absolute right-0 top-0 z-30 flex h-full cursor-pointer items-center justify-center px-4 focus:outline-none">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 group-hover:bg-white/50 group-focus:outline-none group-focus:ring-4 group-focus:ring-white dark:bg-gray-800/30 dark:group-hover:bg-gray-800/60 dark:group-focus:ring-gray-800/70">
                        <svg class="h-4 w-4 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg>
                        <span class="hidden">Next</span>
                    </span>
                </button>
            </div>
        </div>
    </div>
</x-guest-layout>

@vite(['resources/js/login/index.tsx'])
