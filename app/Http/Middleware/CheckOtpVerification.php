<?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Http\Response;
    use Illuminate\Support\Facades\Auth;

    class CheckOtpVerification {
        public function handle(Request $request, Closure $next, ...$guards) {
            $guards = empty($guards) ? [null] : $guards;

            foreach ( $guards as $guard ) {
                if (Auth::guard($guard)->check() && !session()->has('otp_verified')) {
                    return redirect()->intended(route('login', absolute: false));
                } else {
                    return $next($request);
                }
            }

            return $next($request);
        }
    }
