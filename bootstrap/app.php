<?php

    use App\Http\Middleware\Authenticate;
    use App\Http\Middleware\DetectDevice;
    use App\Http\Middleware\DetectRole;
    use Carbon\Carbon;
    use Illuminate\Foundation\Application;
    use Illuminate\Foundation\Configuration\Exceptions;
    use Illuminate\Foundation\Configuration\Middleware;
    use Illuminate\Http\Request;
    use Mcamara\LaravelLocalization\Middleware\LaravelLocalizationRedirectFilter;
    use Mcamara\LaravelLocalization\Middleware\LaravelLocalizationRoutes;
    use Mcamara\LaravelLocalization\Middleware\LaravelLocalizationViewPath;
    use Mcamara\LaravelLocalization\Middleware\LocaleCookieRedirect;
    use Mcamara\LaravelLocalization\Middleware\LocaleSessionRedirect;
    use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
    use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

    return Application::configure(basePath: dirname(__DIR__))
        ->withRouting(
            web: __DIR__ . '/../routes/web.php',
            commands: __DIR__ . '/../routes/console.php',
            health: '/up',
        )
        ->withMiddleware(function (Middleware $middleware) {
            $middleware->web(append: [
                DetectDevice::class,
            ]);

            $middleware->alias([
                'localize' => LaravelLocalizationRoutes::class,
                'localizationRedirect' => LaravelLocalizationRedirectFilter::class,
                'localeSessionRedirect' => LocaleSessionRedirect::class,
                'localeCookieRedirect' => LocaleCookieRedirect::class,
                'localeViewPath' => LaravelLocalizationViewPath::class,
                'detectDevice' => DetectDevice::class,
            ]);
        })
        ->withExceptions(function (Exceptions $exceptions) {
            $exceptions->render(function (Throwable $e, Request $request) {
                $isAjaxRequest = $request->ajax() || $request->wantsJson() || ($request->header('X-Requested-With') === 'XMLHttpRequest');

                $isFormRequest = !$isAjaxRequest && (
                        $request->header('Content-Type') === 'application/x-www-form-urlencoded' ||
                        str_contains($request->header('Content-Type'), 'multipart/form-data')
                    );

                if ($isAjaxRequest || $request->isJson()) {
                    return response()->json([
                        'message' => $e->getMessage() . ' on line ' . $e->getLine(),
                        'file' => $e->getFile(),
                        'type' => get_class($e),
                        'responseTime' => Carbon::now(),
                    ], 500);
                } else {
                    return false;
                }
            });

            $exceptions->render(function (NotFoundHttpException $e, Request $request) {
                if ($request->isJson()) {
                    return response()->json([
                        'message' => $e->getMessage() . ' on line ' . $e->getLine(),
                        'responseTime' => Carbon::now(),
                    ], 404);
                } else if ($request->getContentTypeFormat() == 'form') {
                    return response()->json([
                        'message' => $e->getMessage() . ' on line ' . $e->getLine(),
                        'responseTime' => Carbon::now(),
                    ], 404);
                } else {
                    return response()->view('errors.404', [
                        'message' => 'Halaman yang anda maksud tidak ditemukan!'
                    ]);
                }
            });

            $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
                if ($request->getContentTypeFormat() == 'form') {
                    return response()->json([
                        'message' => $request->method() . ' Method is not Allowed!',
                        'responseTime' => Carbon::now(),
                    ], 405);
                } else if ($request->isJson()) {
                    return response()->json([
                        'message' => $request->method() . ' Method is not Allowed!',
                        'responseTime' => Carbon::now(),
                    ], 405);
                } else {
                    return response()->view('errors.405', [
                        'message' => $request->method() . ' Method is not Allowed!',
                    ]);
                }
            });
        })->create();
