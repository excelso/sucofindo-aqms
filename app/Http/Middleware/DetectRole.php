<?php

    namespace App\Http\Middleware;

    use Auth;
    use Closure;
    use Illuminate\Http\Request;
    use Symfony\Component\HttpFoundation\Response;

    class DetectRole {
        /**
         * Handle an incoming request.
         *
         * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
         */
        public function handle(Request $request, Closure $next): Response {
            $user = Auth::user();

            if (!$user) return redirect()->route('login');

            // Set role_id ke dalam request attribute
            $request->attributes->set('role_id', $user->role_id);
            return $next($request);
        }
    }
