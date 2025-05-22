<?php

    namespace App\Http\Middleware;

    use Carbon\Carbon;
    use Closure;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use Symfony\Component\HttpFoundation\Response;

    class Authenticate {
        /**
         * Handle an incoming request.
         *
         * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
         */
        public function handle(Request $request, Closure $next): Response {
            if ($request->is('api/*')) {
                abort(response()->json([
                    'message' => 'Unauthorized',
                    'responseTime' => Carbon::now()
                ], 401));
            } else {
                if (!$request->expectsJson()) {
                    return redirect()->route('login');
                }
            }

            return $next($request);
        }
    }
