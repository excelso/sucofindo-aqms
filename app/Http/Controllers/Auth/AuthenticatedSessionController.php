<?php

    namespace App\Http\Controllers\Auth;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\Auth\LoginRequest;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\View\View;
    use Psr\Container\ContainerExceptionInterface;
    use Psr\Container\NotFoundExceptionInterface;

    class AuthenticatedSessionController extends Controller {
        /**
         * Display the login view.
         */
        public function create(): View {
            return view('auth.landing');
        }

        /**
         * Handle an incoming authentication request.
         */
        public function store(LoginRequest $request): RedirectResponse {
            $request->authenticate();
            $request->session()->regenerate();

            if (config('app.env') == 'local') {
                session(['otp_verified' => true]);

                try {
                    if (session()->get('use_aqms') != 0 && session()->get('use_sparing') != 0) {
                        return redirect()->intended(route('enviro.dashboard'));
                    } else {
                        if (session()->get('use_aqms') != 0) {
                            return redirect()->intended(route('aqms.dashboard'));
                        } else {
                            return redirect()->intended(route('sparing.dashboard.hasil-pengukuran'));
                        }
                    }
                } catch (NotFoundExceptionInterface|ContainerExceptionInterface $e) {
                    return redirect()->intended(route('aqms.dashboard'));
                }
            } else {
                return redirect()->intended(route('verify-otp', absolute: false));
            }
        }

        /**
         * Destroy an authenticated session.
         */
        public function destroy(Request $request): RedirectResponse {
            $request->session()->forget('otp_verified');
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login');
        }
    }
