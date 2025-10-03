<x-guest-layout>
    <!-- Session Status -->
    <div class="landing">
        <!-- Opening curtain -->
        <div class="curtain" aria-hidden="true">
            <div class="dot"></div>
        </div>

        <header>
            <img src="{{url('/images/logo-enviro1.png')}}" class="mx-auto w-[250px]" alt="Logo"/>
        </header>

        <div class="landing">
            <div class="particles" aria-hidden="true">
                <span class="bubble" style="left:6%"></span>
                <span class="bubble" style="left:22%"></span>
                <span class="bubble" style="left:58%"></span>
                <span class="bubble" style="left:74%"></span>
                <span class="bubble" style="left:90%"></span>
            </div>
            <div class="text-box">
                <h1 class="title">Better Energy, Brighter Future</h1>
                <p class="subtitle">Enabling a greener future through pioneering sustainable biogas solutions.</p>
                <button class="btn-login" id="loginBtn">Login</button>
            </div>
            <div class="image-box">
                <img src="{{ url('/images/bg-biogas.png') }}" alt="Biogas Illustration">
            </div>
        </div>
        <!-- Backdrop + Modal -->
        <div class="backdrop" id="backdrop" aria-hidden="true">
            <x-auth-session-status class="mb-4" :status="session('status')"/>
            <div class="modal-landing" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
                <div class="close-x" id="closeX">&times;</div>
                <h2 id="loginTitle">Login</h2>
                <p class="helper">Masuk untuk mengakses dashboard BEnviro.</p>
                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="form-group">
                        <label> Username / Email </label>
                        <div class="form-group-control">
                            <div class="form-control-prepend">
                                <div class="form-control-prepend-text">
                                    <i class="fa fa-envelope"></i>
                                </div>
                            </div>
                            <input type="text" name="email" class="form-control input email" placeholder="name@mail.com"/>
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
                            <div class="form-control-prepend">
                                <div class="form-control-prepend-text">
                                    <i class="fa fa-lock"></i>
                                </div>
                            </div>
                            <input type="password" name="password" class="form-control passw" placeholder="··················"/>
                            <div class="form-control-append">
                                <div class="form-control-append-text">
                                    <a class="show-pass btnLookPass">
                                        <i class="fas fa-eye-slash"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                        @if(count($errors) != 0 && isset($errors->get('password')[0]))
                            <div class="info-alert-text error errorPassword">
                                <i class="fas fa-exclamation-circle"></i>
                                <div class="errorPasswordText">{{$errors->get('password')[0]}}</div>
                            </div>
                        @endif
                    </div>
                    <div class="aux">
                        <label class="remember">
                            <input type="checkbox" id="remember"> Remember me
                        </label>
                        <span class="forgot"><a href="#" onclick="alert('Forgot Password demo');return false;">Forgot password?</a></span>
                    </div>

                    @if(count($errors) != 0 && $errors->first('login-failed') != '')
                        <div class="ds-alert ds-alert-error rounded-md mt-4">
                            <div class="text-white text-sm">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>{{ $errors->first('login-failed') }}</span>
                            </div>
                        </div>
                    @endif
                    <button class="submit" type="submit">Submit</button>
                </form>
            </div>
        </div>

        <script>
            const loginBtn = document.getElementById('loginBtn');
            const backdrop = document.getElementById('backdrop');
            const closeX = document.getElementById('closeX');

            // button ripple + open modal
            loginBtn.addEventListener('click', function (e) {
                // ripple
                const circle = document.createElement('span');
                const diameter = Math.max(this.clientWidth, this.clientHeight);
                const rect = this.getBoundingClientRect();
                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
                circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
                circle.classList.add('ripple');
                const old = this.getElementsByClassName('ripple')[0];
                if (old) old.remove();
                this.appendChild(circle);

                // show modal with small delay to let ripple play
                setTimeout(() => {
                    backdrop.classList.add('show');
                    // allow screen readers
                    backdrop.setAttribute('aria-hidden', 'false');
                }, 140);
            });

            function closeModal() {
                backdrop.classList.remove('show');
                backdrop.setAttribute('aria-hidden', 'true');
            }

            closeX.addEventListener('click', closeModal);
            window.addEventListener('click', (e) => {
                if (e.target === backdrop) closeModal();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal();
            });
        </script>
    </div>
</x-guest-layout>

@vite(['resources/js/login/index.tsx'])
