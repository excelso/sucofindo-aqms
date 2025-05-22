<?php

    namespace App\Providers;

    use App\Http\Helper\ExHash;
    use App\Http\Helper\ExImage;
    use Illuminate\Foundation\AliasLoader;
    use Illuminate\Foundation\Support\Providers\RouteServiceProvider;
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
        }

        /**
         * Bootstrap any application services.
         */
        public function boot(): void {
            // RouteServiceProvider::loadCachedRoutesUsing(fn() => $this->loadCachedRoutes());
        }
    }
