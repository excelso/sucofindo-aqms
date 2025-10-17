<?php

    namespace App\Providers;

    use App\Http\Helper\Common;
    use App\Http\Helper\ExHash;
    use App\Http\Helper\ExImage;
    use Carbon\Carbon;
    use Illuminate\Foundation\AliasLoader;
    use Illuminate\Foundation\Support\Providers\RouteServiceProvider;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\URL;
    use Illuminate\Support\ServiceProvider;
    use \Mcamara\LaravelLocalization\Traits\LoadsTranslatedCachedRoutes;

    class AppServiceProvider extends ServiceProvider {
        /**
         * Register any application services.
         */
        public function register(): void {
            $loader = AliasLoader::getInstance();
            $loader->alias('ExHash', ExHash::class);
            $loader->alias('ExImage', ExImage::class);
            $loader->alias('Common', Common::class);
            $loader->alias('Carbon', Carbon::class);
        }

        /**
         * Bootstrap any application services.
         */
        public function boot(): void {
            if (config('app.env') != 'local') {
                if ($this->app->runningInConsole()) {
                    return;
                }

                $host = request()->getHost();
                $httpsOnlyDomains = [
                    'beenviro.beraucoal.co.id',
                ];

                if (in_array($host, $httpsOnlyDomains, true)) {
                    URL::forceScheme('https');
                }
            }

            Auth::provider('external-api', function ($app, array $config) {
                return new ExternalApiUserProvider();
            });
            // RouteServiceProvider::loadCachedRoutesUsing(fn() => $this->loadCachedRoutes());
        }
    }
