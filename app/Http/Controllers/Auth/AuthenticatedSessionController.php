<?php

    namespace App\Http\Controllers\Auth;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\Auth\LoginRequest;
    use App\Models\BeSparing\Master\Platform;
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
                            if (!in_array(Auth::user()->user_level, ['super_admin', 'admin'])) {
                                if (session()->get('use_sparing') > 1) {
                                    return redirect()->intended(route('sparing.dashboard.maps'));
                                } else {
                                    $dataPlatform = Platform::platformMarker($request->user()->id_sparing)->get();
                                    return redirect()->intended(route('sparing.dashboard.maps.summary', [$dataPlatform[0]->uid, $dataPlatform[0]->tipe_logger]));
                                }
                            } else {
                                return redirect()->intended(route('sparing.dashboard.hasil-pengukuran'));
                            }
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
            $request->session()->forget('use_aqms');
            $request->session()->forget('use_sparing');
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login');
        }
    }
