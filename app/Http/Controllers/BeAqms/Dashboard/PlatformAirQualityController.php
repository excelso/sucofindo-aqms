<?php

    namespace App\Http\Controllers\BeAqms\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\LoggersLimit;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use Carbon\Carbon;
    use Exception;
    use GuzzleHttp\Client;
    use GuzzleHttp\Exception\GuzzleException;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Log;

    class PlatformAirQualityController extends Controller {
        /**
         * Get list of all platforms (without data)
         * Endpoint: /api/platforms
         */
        public function getPlatformsList(Request $request) {
            try {
                // User platform filtering
                $userPlatformIds = UserPlatforms::userPlatforms($request->user()->id)
                    ->pluck('platform_id');
                $userPlatformId = $userPlatformIds->toArray();

                // Get platforms list
                $platforms = Platforms::dataPlatformByUserPlatform($userPlatformId)
                    ->with('sitesLocation')->get();

                $isPtzSupport = in_array($request->user()->user_level, ['super_admin', 'admin']);

                $platformTemp = [];
                foreach ($platforms as $platform) {
                    $platformTemp[] = [
                        'uid' => $platform->uid,
                        'uid_alias' => $platform->uid_alias,
                        'siteName' => $platform->sitesLocation->location_name ?? 'Unknown',
                        'cctvLink1' => $platform->cctv_link_1,
                        'cctv1IsSupportPTZ' => $isPtzSupport ? $platform->cctv_1_support_ptz : 0,
                        'cctvLink2' => $platform->cctv_link_2,
                        'cctv2IsSupportPTZ' => $isPtzSupport ? $platform->cctv_2_support_ptz : 0,
                        'timezone' => $platform->timezone,
                        'locale' => 'en-US',
                    ];
                }

                return response()->json($platformTemp);

            } catch (Exception $e) {
                // Log::error('Error getting platforms list: ' . $e->getMessage());

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
                    'date' => $request->input('date'),
                    'uid' => $platform->uid,
                    'uid_alias' => $platform->uid_alias,
                    'siteName' => $platform->sitesLocation->location_name ?? 'Unknown',
                    'status' => $status['status'],
                    'emoji' => $status['emoji'],
                    'colorCode' => $status['colorCode'],
                    'metrics' => $this->formatMetrics($uid, $dataLastLogger),
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
                // Log::error("Error getting platform data for {$uid}: " . $e->getMessage());

                return response()->json([
                    'message' => 'Failed to load platform data',
                    'error' => config('app.debug') ? $e->getMessage() . ' on line ' . $e->getLine() : 'Internal server error'
                ], 500);
            }
        }

        /**
         * Get latest logger data
         */
        private function getLatestLoggerData($uid, $minDate, $maxDate, $timezone) {
            return Loggers::loggerData5Minutes($uid, $minDate, $maxDate, $timezone)
                ->with('limit')
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
        private function formatMetrics($uid, $dataLastLogger) {
            $platformLimit = LoggersLimit::where('uid', $uid)->first();
            return [
                'pm10' => [
                    'value' => $dataLastLogger ? $dataLastLogger->max_tsp * 0.4 : 0,
                    'bml_min' => $platformLimit->pm10_min ?? 0,
                    'bml_min_buffer' => $platformLimit->pm10_min_buffer ?? 0,
                    'bml_max_buffer' => $platformLimit->pm10_max_buffer ?? 0,
                    'bml_max' => $platformLimit->pm10_max ?? 0,
                ],
                'pm25' => [
                    'value' => $dataLastLogger->max_pm_25 ?? 0,
                    'bml_min' => $platformLimit->pm25_min ?? 0,
                    'bml_min_buffer' => $platformLimit->pm25_min_buffer ?? 0,
                    'bml_max_buffer' => $platformLimit->pm25_max_buffer ?? 0,
                    'bml_max' => $platformLimit->pm25_max ?? 0,
                ],
                'tsp' => [
                    'value' => $dataLastLogger->max_tsp ?? 0,
                    'bml_min' => $platformLimit->tsp_min ?? 0,
                    'bml_min_buffer' => $platformLimit->tsp_min_buffer ?? 0,
                    'bml_max_buffer' => $platformLimit->tsp_max_buffer ?? 0,
                    'bml_max' => $platformLimit->tsp_max ?? 0,
                ],
                'noise' => [
                    'value' => $dataLastLogger->noise_leq ?? 0,
                    'bml_min' => $platformLimit->noise_min ?? 0,
                    'bml_min_buffer' => $platformLimit->noise_min_buffer ?? 0,
                    'bml_max_buffer' => $platformLimit->noise_max_buffer ?? 0,
                    'bml_max' => $platformLimit->noise_max ?? 0,
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
                ->get();

            $data = [];
            foreach ($loggers as $logger) {

                $value = (float)($logger->max_aqi_index ?? 0);
                if ($logger->aqi_from == 'pm_10') {
                    $value = (float)($logger->max_aqi_index ? $logger->max_aqi_index * 0.4 : 0);
                }

                $data[] = [
                    'timestamp' => $logger->datetime_unix,
                    'value' => $value,
                    'value_tsp' => (float)($logger->max_aqi_index_tsp ?? 0),
                    'pm25' => $logger->pm_25,
                    'pm10' => $logger->max_tsp * 0.4,
                    'tsp' => $logger->max_tsp,
                    'aqi_from' => $logger->aqi_from,
                    'link_video_id' => $logger->link_video_id,
                    'link_video_status' => $logger->link_video_status,
                    'link_video_recorded' => $logger->link_video_recorded,
                ];
            }

            return $data;
        }

        /**
         * Get forecast data from Google Air Quality API
         * Endpoint: /api/platform/{uid}/forecast
         */
        public function getPlatformForecast(Request $request, $uid) {
            try {
                // Get platform basic info
                $platform = Platforms::with(['sites', 'sitesLocation'])
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

                // Check if platform has coordinates
                if (!$platform->lat || !$platform->lng) {
                    return response()->json([
                        'message' => 'Platform coordinates not available'
                    ], 400);
                }

                // Get days parameter (default 1, max 3)
                $days = min((int)$request->input('days', 3), 3);

                // Get forecast data from Google API with pagination
                $forecastData = $this->getGoogleAirQualityForecast(
                    $platform->lat,
                    $platform->lng,
                    $days,
                    $platform->timezone
                );

                if (!$forecastData) {
                    return response()->json([
                        'message' => 'Failed to fetch forecast data'
                    ], 500);
                }

                // Format forecast data for frontend
                $formattedForecast = $this->formatForecastData($forecastData);

                return response()->json([
                    'uid' => $platform->uid,
                    'uid_alias' => $platform->uid_alias,
                    'siteName' => $platform->sitesLocation->location_name ?? 'Unknown',
                    'timezone' => $platform->timezone,
                    'locale' => 'en-US',
                    'lat' => $platform->lat,
                    'lng' => $platform->lng,
                    'days' => $days,
                    'forecastData' => $formattedForecast,
                    'source' => 'google_forecast',
                    'totalDataPoints' => count($formattedForecast)
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'message' => 'Failed to load forecast data',
                    'error' => config('app.debug') ? $e->getMessage() . ' on line ' . $e->getLine() : 'Internal server error'
                ], 500);
            }
        }

        /**
         * Get forecast from Google Air Quality API
         */
        private function getGoogleAirQualityForecast($lat, $lng, $days = 1, $timezone = 'Asia/Makassar') {
            try {
                $apiKey = env('GOOGLE_AIR_QUALITY_API_KEY', 'AIzaSyDEleaYlHD-fQ8CzpcWuBj3nbZbYFr7IZs');
                $url = "https://airquality.googleapis.com/v1/forecast:lookup?key={$apiKey}";

                // Calculate start and end time based on days parameter
                $startTime = Carbon::now($timezone)->addDay()->format('Y-m-d\T00:00:00P');
                $endTime = Carbon::now($timezone)->addDays($days)->format('Y-m-d\T23:59:00P');

                $payload = [
                    'location' => [
                        'latitude' => (float)$lat,
                        'longitude' => (float)$lng
                    ],
                    'period' => [
                        'startTime' => $startTime,
                        'endTime' => $endTime
                    ],
                    'extraComputations' => ['LOCAL_AQI'],
                    'customLocalAqis' => [
                        [
                            'regionCode' => 'id',
                            'aqi' => 'idn_menlhk'
                        ]
                    ],
                    'universalAqi' => false,
                    'languageCode' => 'id'
                ];

                $client = new Client();
                $allForecasts = [];
                $pageToken = null;
                $maxPages = 10; // Safety limit to prevent infinite loops
                $currentPage = 0;

                // Loop through all pages
                do {
                    $currentPage++;

                    // Add pageToken to payload if exists
                    if ($pageToken) {
                        $payload['pageToken'] = $pageToken;
                    }

                    // Log::info("Fetching Google Air Quality forecast page {$currentPage}", [
                    //     'lat' => $lat,
                    //     'lng' => $lng,
                    //     'days' => $days,
                    //     'hasPageToken' => !is_null($pageToken)
                    // ]);

                    $response = $client->post($url, [
                        'json' => $payload,
                        'headers' => [
                            'Content-Type' => 'application/json'
                        ]
                    ]);

                    $data = json_decode($response->getBody()->getContents(), true);

                    // Merge hourly forecasts
                    if (isset($data['hourlyForecasts'])) {
                        $allForecasts = array_merge($allForecasts, $data['hourlyForecasts']);
                    }

                    // Get next page token
                    $pageToken = $data['nextPageToken'] ?? null;

                    // Safety check
                    if ($currentPage >= $maxPages) {
                        // Log::warning("Reached maximum page limit for Google Air Quality forecast");
                        break;
                    }

                } while ($pageToken !== null);

                // Log::info("Google Air Quality forecast fetch completed", [
                //     'totalPages' => $currentPage,
                //     'totalForecasts' => count($allForecasts)
                // ]);

                // Return data with all forecasts
                return [
                    'hourlyForecasts' => $allForecasts,
                    'regionCode' => $data['regionCode'] ?? 'id'
                ];

            } catch (Exception|GuzzleException $e) {
                return null;
            }
        }

        /**
         * Format forecast data for frontend
         */
        private function formatForecastData($googleData) {
            if (!isset($googleData['hourlyForecasts'])) {
                return [];
            }

            $formattedData = [];

            foreach ($googleData['hourlyForecasts'] as $forecast) {
                if (!isset($forecast['indexes'][0])) {
                    continue;
                }

                $index = $forecast['indexes'][0];
                $timestamp = strtotime($forecast['dateTime']);

                $dominantPollutant = $index['dominantPollutant'] ?? 'pm25';
                $pollutantMap = [
                    'pm25' => 'PM2.5',
                    'pm10' => 'PM10',
                    'o3' => 'O3 (Ozone)',
                    'no2' => 'NO2',
                    'so2' => 'SO2',
                    'co' => 'CO'
                ];

                $pollutantName = $pollutantMap[$dominantPollutant] ?? strtoupper($dominantPollutant);

                $formattedData[] = [
                    'timestamp' => $timestamp,
                    'value' => (float)$index['aqi'],
                    'value_tsp' => (float)$index['aqi'], // Google uses same AQI for both
                    'pm25' => 0, // Not provided by Google forecast
                    'pm10' => 0, // Not provided by Google forecast
                    'tsp' => 0, // Not provided by Google forecast
                    'aqi_from' => 'Forecast - ' . ($pollutantName),
                    'category' => $index['category'] ?? 'Unknown',
                    'link_video_id' => null,
                    'link_video_status' => null,
                    'link_video_recorded' => null,
                ];
            }

            return $formattedData;
        }
    }
