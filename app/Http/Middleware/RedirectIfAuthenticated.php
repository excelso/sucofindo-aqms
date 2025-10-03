<?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Http\Response;
    use Illuminate\Support\Facades\Auth;
    use Psr\Container\ContainerExceptionInterface;
    use Psr\Container\NotFoundExceptionInterface;

    class RedirectIfAuthenticated {
        /**
         * Handle an incoming request.
         *
         * @param Request $request
         * @param Closure(Request): (Response|RedirectResponse) $next
         * @param string|null ...$guards
         * @return Response|RedirectResponse
         */
        public function handle(Request $request, Closure $next, ...$guards): Response|RedirectResponse {
            $guards = empty($guards) ? [null] : $guards;

            foreach ($guards as $guard) {
                if (Auth::guard($guard)->check()) {
                    if (!session()->has('otp_verified')) {
                        if (config('app.env') != 'local') {
                            return redirect()->route('verify-otp');
                        }
                    }

                    try {
                        if (session()->get('use_aqms') != 0) {
                            return redirect()->intended(route('aqms.dashboard'));
                        } else {
                            return redirect()->intended(route('sparing.dashboard.hasil-pengukuran'));
                        }
                    } catch (NotFoundExceptionInterface|ContainerExceptionInterface $e) {
                        return redirect()->intended(route('aqms.dashboard'));
                    }
                }
            }

            return $next($request);
        }
    }
