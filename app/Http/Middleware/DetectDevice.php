<?php

    namespace App\Http\Middleware;

    use Auth;
    use Closure;
    use Illuminate\Http\Request;
    use Jenssegers\Agent\Agent;
    use Symfony\Component\HttpFoundation\Response;

    class DetectDevice {
        /**
         * Handle an incoming request.
         *
         * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
         */
        public function handle(Request $request, Closure $next): Response {
            $agent = new Agent();

            if ($agent->isMobile()) {
                $request->attributes->set('device', 'mobile');
            } elseif ($agent->isDesktop()) {
                $request->attributes->set('device', 'desktop');
            } else {
                $request->attributes->set('device', 'unknown');
            }

            return $next($request);
        }
    }
