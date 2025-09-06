<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Platforms;
    use App\Models\Master\Loggers;
    use App\Models\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;

    class PlatformAirQualityController extends Controller {
        /**
         * Get list of all platforms (without data)
         * Endpoint: /api/platforms
         */
        public function getPlatformsList(Request $request) {
            try {
                // User platform filtering
                $userPlatformId = null;
                $isTrial = 0;

                if ($request->user()->user_level != 'super_admin') {
                    $isTrial = 1;
                    $userPlatformIds = UserPlatforms::userPlatforms($request->user()->id)
                        ->pluck('platform_id');
                    $userPlatformId = $userPlatformIds->toArray();
                }

                // Get platforms list
                $platforms = Platforms::select([
                    'uid',
                    'uid_alias',
                    'cctv_link_1',
                    'cctv_link_2',
                    'cctv_1_support_ptz',
                    'cctv_2_support_ptz'
                ])->dataPlatformByUserPlatform($userPlatformId, $isTrial)->get();

                return response()->json($platforms);

            } catch (Exception $e) {
                Log::error('Error getting platforms list: ' . $e->getMessage());

                return response()->json([
                    'message' => 'Failed to load platforms list',
                    'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
                ], 500);
            }
        }

        /**
         * Get individual platform data
         * Endpoint: /api/platform/{uid}/data
         */
        public function getPlatformData(Request $request, $uid) {
            try {
                // Get platform basic info
                $platform = Platforms::with(['sites', 'loggerLimit', 'sitesLocation'])
                    ->where('uid', $uid)
                    ->first();

                if (!$platform) {
                    return response()->json([
                        'message' => 'Platform not found'
                    ], 404);
                }

                // Check user access
                if ($request->user()->user_level != 'super_admin') {
                    $hasAccess = UserPlatforms::where('user_id', $request->user()->id)
                        ->where('platform_id', $platform->id)
                        ->exists();

                    if (!$hasAccess) {
                        return response()->json([
                            'message' => 'Access denied'
                        ], 403);
                    }
                }

                // Date range setup
                $timezone = $platform->timezone;
                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');

                if ($request->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                // Get latest logger data
                $dataLastLogger = $this->getLatestLoggerData($uid, $minDate, $maxDate, $timezone);

                // Get heartbeat status
                $platformHeartbeat = $this->getPlatformHeartbeat($uid, $minDate, $maxDate, $timezone);

                // Process status
                $status = $this->processStatus($dataLastLogger);

                // Get air index data
                $airIndexData = $this->getAirIndexData($uid, $minDate, $maxDate, $timezone);

                return response()->json([
                    'uid' => $platform->uid,
                    'uid_alias' => $platform->uid_alias,
                    'siteName' => $platform->sitesLocation->location_name ?? 'Unknown',
                    'status' => $status['status'],
                    'emoji' => $status['emoji'],
                    'colorCode' => $status['colorCode'],
                    'metrics' => $this->formatMetrics($dataLastLogger),
                    'isOnline' => $platformHeartbeat && $platformHeartbeat->heartbeat_status === 'Online',
                    'location' => $platform->sitesLocation->location_name ?? null,
                    'timezone' => $platform->timezone,
                    'locale' => 'en-US',
                    'lat' => $platform->lat,
                    'lng' => $platform->lng,
                    'airIndexData' => $airIndexData,
                    'lastUpdated' => $dataLastLogger ?
                        Carbon::createFromTimestampUTC($dataLastLogger->datetime_unix)
                            ->timezone($timezone)
                            ->toIso8601String() : null,
                ]);

            } catch (Exception $e) {
                Log::error("Error getting platform data for {$uid}: " . $e->getMessage());

                return response()->json([
                    'message' => 'Failed to load platform data',
                    'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
                ], 500);
            }
        }

        /**
         * Get latest logger data
         */
        private function getLatestLoggerData($uid, $minDate, $maxDate, $timezone) {
            return Loggers::with('limit')
                ->loggerData5Minutes($uid, $minDate, $maxDate, $timezone)
                ->orderBy('datetime_unix', 'DESC')
                ->first();
        }

        /**
         * Get platform heartbeat
         */
        private function getPlatformHeartbeat($uid, $minDate, $maxDate, $timezone) {
            return PlatformsHeartbeat::select(['heartbeat_status'])
                ->platformsHeartbeat($uid, $minDate, $maxDate, $timezone)
                ->first();
        }

        /**
         * Process platform status
         */
        private function processStatus($dataLastLogger) {
            $status = 'Unknown';
            $statusColor = 'bg-gray-200';
            $statusEmo = '❓';

            if ($dataLastLogger && isset($dataLastLogger->limit)) {
                $tsp = $dataLastLogger->max_tsp ?? 0;
                $limit = $dataLastLogger->limit;

                if ($tsp > $limit->tsp_max_buffer && $tsp < $limit->tsp_max) {
                    $status = 'Moderate';
                    $statusColor = 'bg-orange-200';
                    $statusEmo = '😞';
                } elseif ($tsp > $limit->tsp_max) {
                    $status = 'Not Good';
                    $statusColor = 'bg-red-300';
                    $statusEmo = '🤢';
                } else {
                    $status = 'Good';
                    $statusColor = 'bg-green-200';
                    $statusEmo = '😁';
                }
            }

            return [
                'status' => $status,
                'colorCode' => $statusColor,
                'emoji' => $statusEmo
            ];
        }

        /**
         * Format metrics data
         */
        private function formatMetrics($dataLastLogger) {
            if (!$dataLastLogger || !isset($dataLastLogger->limit)) {
                return [
                    'pm10' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'pm25' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'tsp' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'noise' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0]
                ];
            }

            $limit = $dataLastLogger->limit;

            return [
                'pm10' => [
                    'value' => $dataLastLogger->max_pm_10 ?? 0,
                    'bml_min' => $limit->pm10_min ?? 0,
                    'bml_min_buffer' => $limit->pm10_min_buffer ?? 0,
                    'bml_max_buffer' => $limit->pm10_max_buffer ?? 0,
                    'bml_max' => $limit->pm10_max ?? 0,
                ],
                'pm25' => [
                    'value' => $dataLastLogger->max_pm_25 ?? 0,
                    'bml_min' => $limit->pm25_min ?? 0,
                    'bml_min_buffer' => $limit->pm25_min_buffer ?? 0,
                    'bml_max_buffer' => $limit->pm25_max_buffer ?? 0,
                    'bml_max' => $limit->pm25_max ?? 0,
                ],
                'tsp' => [
                    'value' => $dataLastLogger->max_tsp ?? 0,
                    'bml_min' => $limit->tsp_min ?? 0,
                    'bml_min_buffer' => $limit->tsp_min_buffer ?? 0,
                    'bml_max_buffer' => $limit->tsp_max_buffer ?? 0,
                    'bml_max' => $limit->tsp_max ?? 0,
                ],
                'noise' => [
                    'value' => $dataLastLogger->noise_leq ?? 0,
                    'bml_min' => $limit->noise_min ?? 0,
                    'bml_min_buffer' => $limit->noise_min_buffer ?? 0,
                    'bml_max_buffer' => $limit->noise_max_buffer ?? 0,
                    'bml_max' => $limit->noise_max ?? 0,
                ]
            ];
        }

        /**
         * Get air index data
         */
        private function getAirIndexData($uid, $minDate, $maxDate, $timezone) {
            $loggers = Loggers::select([
                'id',
                'datetime_unix',
                'max_aqi_index',
                'max_aqi_index_tsp',
                'max_pm_25',
                'max_pm_10',
                'max_tsp',
                'aqi_from',
                'link_video_recorded'
            ])
                ->loggerData5Minutes($uid, $minDate, $maxDate, $timezone)
                ->orderBy('datetime_unix', 'ASC')
                ->limit(288) // Last 24 hours
                ->get();

            $data = [];
            foreach ($loggers as $logger) {
                $data[] = [
                    'timestamp' => $logger->datetime_unix,
                    'value' => (float)($logger->max_aqi_index ?? 0),
                    'value_tsp' => (float)($logger->max_aqi_index_tsp ?? 0),
                    'pm25' => $logger->max_pm_25,
                    'pm10' => $logger->max_pm_10,
                    'tsp' => $logger->max_tsp,
                    'aqi_from' => $logger->aqi_from ?? 'PM 2.5',
                    'link_video_id' => $logger->link_video_id,
                    'link_video_status' => $logger->link_video_status,
                    'link_video_recorded' => $logger->link_video_recorded,
                ];
            }

            return $data;
        }
    }
