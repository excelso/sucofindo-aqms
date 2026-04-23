<?php

    namespace App\Http\Controllers\BeEnviro;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\Users\UserPlatforms;
    use Auth;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Cache;

    class BeEnviroControllerDashboard extends Controller {
        protected string $viewPath;

        // Cache TTL dalam detik
        private const CACHE_TTL = 60;

        public function __construct() {
            $this->viewPath = 'main.be-enviro.dashboard';
        }

        // region Index
        public function index(Request $request) {
            return view($this->viewPath . '.index', [
                'env' => config('app.env')
            ]);
        }
        // endregion

        // region Helper: Resolve Thumbnail URL (tanpa file_exists per record)
        /**
         * Langsung return URL path thumbnail tanpa disk I/O file_exists().
         * Validasi file sebaiknya dilakukan saat upload, bukan saat read.
         */
        private function resolveThumbnail(?string $path, ?string $file): ?string {
            if (!$path || !$file) {
                return null;
            }
            return '/storage/' . $path . '/' . $file;
        }
        // endregion

        // region Helper: Get User Platform IDs (dengan cache)
        /**
         * Ambil platform_id milik user, di-cache agar tidak query berulang
         * dalam satu request yang sama.
         */
        private function getUserPlatformIds(int $userId): array {
            $cacheKey = "user_platform_ids_{$userId}";

            return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId) {
                return UserPlatforms::userPlatforms($userId)
                    ->pluck('platform_id')
                    ->toArray();
            });
        }
        // endregion

        // region Handle Data Platforms
        public function handleDataPlatforms(Request $request) {
            try {
                $user = $request->user();
                $titleType = $request->input('titleType');
                $heartbeatStatus = $request->input('heartbeatStatus');
                $search = $request->input('search');

                if ($titleType === 'SPARING') {
                    [$dataLogger, $onlineCount, $offlineCount] = $this->getSparingPlatformData(
                        $user->id_sparing,
                        $heartbeatStatus,
                        $search
                    );
                } else {
                    [$dataLogger, $onlineCount, $offlineCount] = $this->getAqmsPlatformData(
                        $user->id,
                        $heartbeatStatus
                    );
                }

                return response()->json([
                    'userLevel' => Auth::user()->user_level ?? '',
                    'onlineCount' => $onlineCount,
                    'offlineCount' => $offlineCount,
                    'data' => $dataLogger,
                ]);

            } catch (Exception $exception) {
                return $this->errorResponse($exception);
            }
        }

        /**
         * Ambil data platform SPARING beserta count online/offline.
         * Count dihitung via query agregat (bukan load semua data dulu).
         */
        private function getSparingPlatformData(
            mixed   $idSparing,
            ?string $heartbeatStatus,
            ?string $search
        ): array {
            // Query data dengan filter
            $dataLogger = Platform::enviroPlatformBySearch($idSparing, $heartbeatStatus, $search)
                ->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan',
                ])
                ->get();

            // FIX: Hitung online/offline via GROUP BY — tidak perlu load semua data
            $counts = Platform::enviroPlatformBySearch($idSparing)
                ->selectRaw('status_platform, COUNT(*) as total')
                ->groupBy('status_platform')
                ->pluck('total', 'status_platform');

            return [
                $dataLogger,
                (int)($counts['online'] ?? 0),
                (int)($counts['offline'] ?? 0),
            ];
        }

        /**
         * Ambil data platform AQMS beserta count online/offline.
         * Count dihitung via query agregat (bukan load semua data dulu).
         */
        private function getAqmsPlatformData(int $userId, ?string $heartbeatStatus): array {
            $userPlatformId = $this->getUserPlatformIds($userId);

            // Query data dengan filter
            $dataLogger = Platforms::dataPlatformSearchByUserPlatform($userPlatformId, $heartbeatStatus)
                ->with([
                    'sites:id,site_name,company_id',
                    'sites.companies:id,company_name',
                    'sitesLocation',
                ])
                ->get();

            // FIX: Hitung online/offline via GROUP BY — tidak perlu load semua data
            $counts = Platforms::dataPlatformSearchByUserPlatform($userPlatformId)
                ->selectRaw('heartbeat_status, COUNT(*) as total')
                ->groupBy('heartbeat_status')
                ->pluck('total', 'heartbeat_status');

            return [
                $dataLogger,
                (int)($counts['online'] ?? 0),
                (int)($counts['offline'] ?? 0),
            ];
        }
        // endregion

        // region Handle Data Platforms Marker
        public function handleDataPlatformsMarker(Request $request) {
            try {
                $user = $request->user();

                // Jalankan kedua query secara terpisah, hasilnya di-merge
                $dataPlatformSparing = $this->getSparingMarkers($user->id_sparing);
                $dataPlatformAqms = $this->getAqmsMarkers($user->id);

                // Merge dengan uid sebagai key (AQMS override SPARING jika uid sama)
                $mergedData = $dataPlatformSparing->keyBy('uid')
                    ->merge($dataPlatformAqms->keyBy('uid'))
                    ->values();

                return response()->json([
                    'userLevel' => Auth::user()->user_level ?? '',
                    'data' => $mergedData,
                ]);

            } catch (Exception $exception) {
                return $this->errorResponse($exception);
            }
        }

        /**
         * Ambil marker data untuk platform SPARING.
         * FIX: file_exists() dihapus — tidak ada disk I/O per record.
         */
        private function getSparingMarkers(mixed $idSparing) {
            return Platform::platformMarker($idSparing)
                ->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan',
                ])
                ->get()
                ->map(fn($item) => [
                    'platform_type' => 'sparing',
                    'uid' => $item->uid,
                    'lat' => $item->lat,
                    'lng' => $item->lng,
                    'company_name' => $item->site->customerLokasi->customer->nama_perusahaan ?? '',
                    'location' => $item->site->customerLokasi->nama_lokasi ?? '',
                    'images' => $this->resolveThumbnail($item->thumbnail_path, $item->thumbnail_file),
                    'status_online' => $item->status_platform ?? 'offline',
                    'tipe_logger' => $item->tipe_logger ?? 1,
                    'total_logger' => $item->total_logger ?? 1,
                ]);
        }

        /**
         * Ambil marker data untuk platform AQMS.
         * FIX: file_exists() dihapus — tidak ada disk I/O per record.
         * FIX: getUserPlatformIds() di-cache agar tidak double query.
         */
        private function getAqmsMarkers(mixed $userId) {
            $userPlatformId = $this->getUserPlatformIds($userId);

            return Platforms::dataPlatformSearchByUserPlatform($userPlatformId)
                ->with([
                    'sites:id,site_name,company_id',
                    'sites.companies:id,company_name',
                ])
                ->get()
                ->map(fn($item) => [
                    'platform_type' => 'aqms',
                    'uid' => $item->uid,
                    'lat' => $item->lat,
                    'lng' => $item->lng,
                    'company_name' => $item->sites->companies->company_name ?? '',
                    'location' => $item->sites->site_name ?? '',
                    'images' => $this->resolveThumbnail($item->thumbnail_path, $item->thumbnail_file),
                    'status_online' => $item->heartbeat_status ?? 'offline',
                    'tipe_logger' => $item->tipe_logger ?? 1,
                    'total_logger' => 1,
                ]);
        }
        // endregion

        // region Error Response Helper
        private function errorResponse(Exception $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => $exception->getCode(),
                'responseTime' => now(),
            ], 500);
        }
        // endregion
    }
