<?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Platforms;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Support\Facades\Http;

    class HikvisionPTZController extends Controller {
        /**
         * Handle PTZ control commands for Hikvision cameras
         */
        public function control(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'action' => 'required|string|in:move,zoom,stop,preset,absolute,relative,continuous',
                'camera_id' => 'required|string',
                'params' => 'sometimes|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $action = $request->input('action');
                $cameraId = $request->input('camera_id');
                $params = $request->input('params', []);

                // Get camera configuration
                $camera = $this->getCameraById($cameraId);
                if (!$camera || !$camera['supports_ptz']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera does not support PTZ control'
                    ], 400);
                }

                $result = $this->executeHikvisionPTZCommand($camera, $action, $params);

                Log::info("Hikvision PTZ Command executed", [
                    'camera_id' => $cameraId,
                    'action' => $action,
                    'params' => $params,
                    'result' => $result
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'PTZ command executed successfully',
                    'status' => $result['status'],
                    'data' => $result
                ]);

            } catch (Exception $e) {
                Log::error("Hikvision PTZ Command failed", [
                    'camera_id' => $cameraId ?? null,
                    'action' => $action ?? null,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'PTZ command failed: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Execute Hikvision PTZ command based on action
         */
        private function executeHikvisionPTZCommand(array $camera, string $action, array $params): array {
            switch ($action) {
                case 'move':
                    return $this->executeRelativeMove($camera, $params);

                case 'continuous':
                    return $this->executeContinuousMove($camera, $params);

                case 'absolute':
                    return $this->executeAbsoluteMove($camera, $params);

                case 'zoom':
                    return $this->executeZoom($camera, $params);

                case 'stop':
                    return $this->executeStop($camera);

                case 'preset':
                    return $this->executePreset($camera, $params);

                default:
                    throw new \InvalidArgumentException("Unsupported PTZ action: {$action}");
            }
        }

        /**
         * Execute relative movement command (step-by-step)
         */
        private function executeRelativeMove(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $speed = $params['speed'] ?? 50;
            $step = $params['step'] ?? 100;

            // Convert direction to Hikvision relative movement values
            $movements = [
                'up' => ['pan' => 0, 'tilt' => $step],
                'down' => ['pan' => 0, 'tilt' => -$step],
                'left' => ['pan' => -$step, 'tilt' => 0],
                'right' => ['pan' => $step, 'tilt' => 0],
                'up-left' => ['pan' => -$step, 'tilt' => $step],
                'up-right' => ['pan' => $step, 'tilt' => $step],
                'down-left' => ['pan' => -$step, 'tilt' => -$step],
                'down-right' => ['pan' => $step, 'tilt' => -$step]
            ];

            if (!isset($movements[$direction])) {
                throw new \InvalidArgumentException("Invalid direction: {$direction}");
            }

            $movement = $movements[$direction];

            // Build XML payload for relative movement
            $xmlData = "<PTZData>" .
                "<RelativeHigh>" .
                "<azimuth>{$movement['pan']}</azimuth>" .
                "<elevation>{$movement['tilt']}</elevation>" .
                "<absoluteZoom>0</absoluteZoom>" .
                "</RelativeHigh>" .
                "</PTZData>";

            $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/relative', $xmlData);

            return [
                'status' => "Moving {$direction} (relative)",
                'direction' => $direction,
                'pan_step' => $movement['pan'],
                'tilt_step' => $movement['tilt'],
                'speed' => $speed,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute continuous movement command
         */
        private function executeContinuousMove(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $speed = max(1, min(7, intval($params['speed'] ?? 4))); // Hikvision speed range 1-7

            // Convert direction to Hikvision continuous movement values
            $movements = [
                'up' => ['pan' => 0, 'tilt' => $speed],
                'down' => ['pan' => 0, 'tilt' => -$speed],
                'left' => ['pan' => -$speed, 'tilt' => 0],
                'right' => ['pan' => $speed, 'tilt' => 0],
                'up-left' => ['pan' => -$speed, 'tilt' => $speed],
                'up-right' => ['pan' => $speed, 'tilt' => $speed],
                'down-left' => ['pan' => -$speed, 'tilt' => -$speed],
                'down-right' => ['pan' => $speed, 'tilt' => -$speed]
            ];

            if (!isset($movements[$direction])) {
                throw new \InvalidArgumentException("Invalid direction: {$direction}");
            }

            $movement = $movements[$direction];

            // Build XML payload for continuous movement
            $xmlData = "<PTZData>" .
                "<ContinuousPanTilt>" .
                "<panSpeed>{$movement['pan']}</panSpeed>" .
                "<tiltSpeed>{$movement['tilt']}</tiltSpeed>" .
                "</ContinuousPanTilt>" .
                "</PTZData>";

            $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/continuous', $xmlData);

            return [
                'status' => "Continuous moving {$direction}",
                'direction' => $direction,
                'pan_speed' => $movement['pan'],
                'tilt_speed' => $movement['tilt'],
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute absolute movement command
         */
        private function executeAbsoluteMove(array $camera, array $params): array {
            $azimuth = $params['azimuth'] ?? 0;     // Pan position (-1800 to 1800, represents -180.0° to 180.0°)
            $elevation = $params['elevation'] ?? 0;  // Tilt position (-900 to 900, represents -90.0° to 90.0°)
            $zoom = $params['zoom'] ?? 0;           // Zoom level (0 to 100)

            // Validate ranges
            $azimuth = max(-1800, min(1800, intval($azimuth)));
            $elevation = max(-900, min(900, intval($elevation)));
            $zoom = max(0, min(100, intval($zoom)));

            // Build XML payload for absolute movement
            $xmlData = "<PTZData>" .
                "<AbsoluteHigh>" .
                "<azimuth>{$azimuth}</azimuth>" .
                "<elevation>{$elevation}</elevation>" .
                "<absoluteZoom>{$zoom}</absoluteZoom>" .
                "</AbsoluteHigh>" .
                "</PTZData>";

            $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/absolute', $xmlData);

            return [
                'status' => 'Moving to absolute position',
                'azimuth' => $azimuth,
                'elevation' => $elevation,
                'zoom' => $zoom,
                'pan_degrees' => $azimuth / 10.0,
                'tilt_degrees' => $elevation / 10.0,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute zoom command
         */
        private function executeZoom(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $speed = max(1, min(7, intval($params['speed'] ?? 4))); // Hikvision speed range 1-7

            $zoomSpeed = $direction === 'in' ? $speed : -$speed;

            // Build XML payload for zoom
            $xmlData = "<PTZData>" .
                "<ContinuousZoom>" .
                "<zoomSpeed>{$zoomSpeed}</zoomSpeed>" .
                "</ContinuousZoom>" .
                "</PTZData>";

            $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/continuous', $xmlData);

            return [
                'status' => "Zoom {$direction}",
                'direction' => $direction,
                'zoom_speed' => $zoomSpeed,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute stop command
         */
        private function executeStop(array $camera): array {
            // Build XML payload to stop all movements
            $xmlData = "<PTZData>" .
                "<ContinuousPanTilt>" .
                "<panSpeed>0</panSpeed>" .
                "<tiltSpeed>0</tiltSpeed>" .
                "</ContinuousPanTilt>" .
                "</PTZData>";

            $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/continuous', $xmlData);

            return [
                'status' => 'All movements stopped',
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute preset command
         */
        private function executePreset(array $camera, array $params): array {
            $presetNumber = max(1, min(300, intval($params['preset'] ?? 1))); // Hikvision supports up to 300 presets
            $action = $params['action'] ?? 'goto'; // 'goto', 'set', 'clear'

            $endpoint = '';
            $xmlData = '';

            switch ($action) {
                case 'goto':
                    $endpoint = '/ISAPI/PTZCtrl/channels/1/presets/' . $presetNumber . '/goto';
                    $xmlData = "<PTZData><Preset><presetNumber>{$presetNumber}</presetNumber></Preset></PTZData>";
                    break;

                case 'set':
                    $endpoint = '/ISAPI/PTZCtrl/channels/1/presets/' . $presetNumber;
                    $presetName = $params['name'] ?? "Preset {$presetNumber}";
                    $xmlData = "<PTZPreset>" .
                        "<id>{$presetNumber}</id>" .
                        "<presetName>{$presetName}</presetName>" .
                        "</PTZPreset>";
                    break;

                case 'clear':
                    $endpoint = '/ISAPI/PTZCtrl/channels/1/presets/' . $presetNumber;
                    $xmlData = '';
                    break;
            }

            $method = ($action === 'set') ? 'PUT' : (($action === 'clear') ? 'DELETE' : 'PUT');
            $response = $this->sendHikvisionRequest($camera, $method, $endpoint, $xmlData);

            return [
                'status' => "Preset {$action} {$presetNumber}",
                'preset_number' => $presetNumber,
                'action' => $action,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Send HTTP request to Hikvision camera using ISAPI with proper digest auth
         */
        private function sendHikvisionRequest(array $camera, string $method, string $endpoint, string $xmlData = ''): array {
            $baseUrl = $camera['ip_address'];
            $username = $camera['username'];
            $password = $camera['password'];
            $channel = $camera['channel'] ?? 1;

            // Replace channel placeholder in endpoint
            $endpoint = str_replace('/channels/1/', "/channels/{$channel}/", $endpoint);
            $url = "http://{$baseUrl}{$endpoint}";

            try {
                // Use cURL for better digest authentication support
                $result = $this->sendCurlRequest($url, $method, $xmlData, $username, $password);

                Log::info("Hikvision ISAPI Request", [
                    'method' => $method,
                    'url' => $url,
                    'xml_data' => $xmlData,
                    'status_code' => $result['status_code'],
                    'response_body' => $result['response_body']
                ]);

                return $result;

            } catch (Exception $e) {
                Log::error("Hikvision ISAPI Request failed", [
                    'url' => $url,
                    'method' => $method,
                    'xml_data' => $xmlData,
                    'error' => $e->getMessage()
                ]);

                throw new Exception("Failed to communicate with Hikvision camera: " . $e->getMessage());
            }
        }

        /**
         * Send cURL request with proper digest authentication
         */
        private function sendCurlRequest(string $url, string $method, string $xmlData, string $username, string $password): array {
            $ch = curl_init();

            // Basic cURL options
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,

                // Digest authentication
                CURLOPT_HTTPAUTH => CURLAUTH_DIGEST,
                CURLOPT_USERPWD => $username . ':' . $password,

                // Headers
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/xml',
                    'Accept: application/xml',
                    'Content-Length: ' . strlen($xmlData)
                ]
            ]);

            // Set method and data
            switch (strtoupper($method)) {
                case 'PUT':
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                    if (!empty($xmlData)) {
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $xmlData);
                    }
                    break;

                case 'POST':
                    curl_setopt($ch, CURLOPT_POST, true);
                    if (!empty($xmlData)) {
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $xmlData);
                    }
                    break;

                case 'DELETE':
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                    break;

                case 'GET':
                default:
                    // GET is default, no additional options needed
                    break;
            }

            $response = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);

            curl_close($ch);

            if ($response === false || !empty($error)) {
                throw new Exception("cURL error: " . $error);
            }

            return [
                'success' => $statusCode >= 200 && $statusCode < 300,
                'status_code' => $statusCode,
                'response_body' => $response,
                'curl_info' => [
                    'url' => $url,
                    'http_code' => $statusCode
                ]
            ];
        }

        /**
         * Get current PTZ status
         */
        public function getStatus(string $cameraId): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);

                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Get current PTZ status from Hikvision camera
                $response = $this->sendHikvisionRequest($camera, 'GET', '/ISAPI/PTZCtrl/channels/1/status');

                // $xml = simplexml_load_string($response['response_body']);
                return response()->json([
                    'success' => true,
                    // 'status' => $xml->AbsoluteHigh,
                    'status' => $this->parseHikvisionStatus($response['response_body']),
                    'raw_response' => $response
                ], 200, [], JSON_PRETTY_PRINT);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get PTZ status: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Parse Hikvision status XML response
         */
        private function parseHikvisionStatus(string $xmlResponse): array {
            try {
                $xml = simplexml_load_string($xmlResponse);

                return [
                    'azimuth' => (int)$xml->AbsoluteHigh->azimuth ?? 0,
                    'elevation' => (int)$xml->AbsoluteHigh->elevation ?? 0,
                    'zoom' => (int)$xml->AbsoluteHigh->absoluteZoom ?? 0,
                    'pan_degrees' => ((int)$xml->AbsoluteHigh->azimuth ?? 0) / 10.0,
                    'tilt_degrees' => ((int)$xml->AbsoluteHigh->elevation ?? 0) / 10.0,
                    'is_moving' => (string)$xml->AbsoluteHigh->MoveStatus === 'Moving',
                    'timestamp' => now()->toISOString()
                ];
            } catch (Exception $e) {
                return [
                    'error' => 'Failed to parse status response',
                    'raw_response' => $xmlResponse
                ];
            }
        }

        /**
         * Get camera capabilities from Hikvision
         */
        public function getCapabilities(string $cameraId): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);

                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Get PTZ capabilities from Hikvision camera
                $response = $this->sendHikvisionRequest($camera, 'GET', '/ISAPI/PTZCtrl/channels/1/capabilities');

                return response()->json([
                    'success' => true,
                    'capabilities' => $this->parseHikvisionCapabilities($response['response_body']),
                    'raw_response' => $response
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get capabilities: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Parse Hikvision capabilities XML response
         */
        private function parseHikvisionCapabilities(string $xmlResponse): array {
            try {
                $xml = simplexml_load_string($xmlResponse);

                return [
                    'supports_pan' => true,
                    'supports_tilt' => true,
                    'supports_zoom' => (string)$xml->zoom === 'true',
                    'supports_presets' => (string)$xml->preset === 'true',
                    'supports_absolute' => (string)$xml->absoluteControl === 'true',
                    'supports_relative' => (string)$xml->relativeControl === 'true',
                    'supports_continuous' => (string)$xml->continuousControl === 'true',
                    'max_presets' => (int)$xml->maxPresets ?? 300,
                    'pan_range' => [-180.0, 180.0],
                    'tilt_range' => [-90.0, 90.0],
                    'zoom_range' => [0, 100]
                ];
            } catch (Exception $e) {
                // Return default capabilities if parsing fails
                return [
                    'supports_pan' => true,
                    'supports_tilt' => true,
                    'supports_zoom' => true,
                    'supports_presets' => true,
                    'supports_absolute' => true,
                    'supports_relative' => true,
                    'supports_continuous' => true,
                    'max_presets' => 300,
                    'pan_range' => [-180.0, 180.0],
                    'tilt_range' => [-90.0, 90.0],
                    'zoom_range' => [0, 100]
                ];
            }
        }

        /**
         * Absolute movement with specific methods
         */
        public function absoluteMove(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'azimuth' => 'required|integer|between:-1800,1800',
                'elevation' => 'required|integer|between:-900,900',
                'zoom' => 'sometimes|integer|between:0,100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters for absolute movement',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $cameraId = $request->input('camera_id');
                $azimuth = $request->input('azimuth');
                $elevation = $request->input('elevation');
                $zoom = $request->input('zoom', 0);

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executeAbsoluteMove($camera, [
                    'azimuth' => $azimuth,
                    'elevation' => $elevation,
                    'zoom' => $zoom
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Absolute movement executed successfully',
                    'data' => $result
                ]);

            } catch (Exception $e) {
                Log::error("Absolute movement failed", [
                    'camera_id' => $cameraId ?? null,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Absolute movement failed: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Preset-based absolute movements
         */
        public function moveToPosition(string $cameraId, string $position): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Predefined positions
                $positions = [
                    'center' => ['azimuth' => 0, 'elevation' => 0, 'zoom' => 0],
                    'top-left' => ['azimuth' => -900, 'elevation' => 450, 'zoom' => 0],
                    'top-right' => ['azimuth' => 900, 'elevation' => 450, 'zoom' => 0],
                    'bottom-left' => ['azimuth' => -900, 'elevation' => -450, 'zoom' => 0],
                    'bottom-right' => ['azimuth' => 900, 'elevation' => -450, 'zoom' => 0],
                    'far-left' => ['azimuth' => -1800, 'elevation' => 0, 'zoom' => 0],
                    'far-right' => ['azimuth' => 1800, 'elevation' => 0, 'zoom' => 0],
                    'up' => ['azimuth' => 0, 'elevation' => 900, 'zoom' => 0],
                    'down' => ['azimuth' => 0, 'elevation' => -900, 'zoom' => 0],
                    // Example positions like your curl command
                    'example-position' => ['azimuth' => 200, 'elevation' => -600, 'zoom' => 0],
                    'parking-lot' => ['azimuth' => 450, 'elevation' => -300, 'zoom' => 20],
                    'entrance' => ['azimuth' => -200, 'elevation' => 100, 'zoom' => 15]
                ];

                if (!isset($positions[$position])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unknown position: ' . $position,
                        'available_positions' => array_keys($positions)
                    ], 400);
                }

                $targetPosition = $positions[$position];
                $result = $this->executeAbsoluteMove($camera, $targetPosition);

                return response()->json([
                    'success' => true,
                    'message' => "Moving to position: {$position}",
                    'position' => $position,
                    'coordinates' => $targetPosition,
                    'data' => $result
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to move to position: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Move using degrees (more user-friendly)
         */
        public function moveToDegrees(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'pan_degrees' => 'required|numeric|between:-180,180',
                'tilt_degrees' => 'required|numeric|between:-90,90',
                'zoom_level' => 'sometimes|integer|between:0,100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $cameraId = $request->input('camera_id');
                $panDegrees = $request->input('pan_degrees');
                $tiltDegrees = $request->input('tilt_degrees');
                $zoomLevel = $request->input('zoom_level', 0);

                // Convert degrees to Hikvision format (multiply by 10)
                $azimuth = round($panDegrees * 10);
                $elevation = round($tiltDegrees * 10);

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executeAbsoluteMove($camera, [
                    'azimuth' => $azimuth,
                    'elevation' => $elevation,
                    'zoom' => $zoomLevel
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Camera moved to specified degrees',
                    'input_degrees' => [
                        'pan' => $panDegrees,
                        'tilt' => $tiltDegrees,
                        'zoom' => $zoomLevel
                    ],
                    'hikvision_values' => [
                        'azimuth' => $azimuth,
                        'elevation' => $elevation,
                        'zoom' => $zoomLevel
                    ],
                    'data' => $result
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to move camera: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Get available absolute positions
         */
        public function getAvailablePositions(): JsonResponse {
            $positions = [
                'center' => [
                    'name' => 'Center Position',
                    'description' => 'Camera facing straight ahead',
                    'pan_degrees' => 0,
                    'tilt_degrees' => 0,
                    'azimuth' => 0,
                    'elevation' => 0
                ],
                'top-left' => [
                    'name' => 'Top Left',
                    'description' => 'Upper left corner view',
                    'pan_degrees' => -90,
                    'tilt_degrees' => 45,
                    'azimuth' => -900,
                    'elevation' => 450
                ],
                'top-right' => [
                    'name' => 'Top Right',
                    'description' => 'Upper right corner view',
                    'pan_degrees' => 90,
                    'tilt_degrees' => 45,
                    'azimuth' => 900,
                    'elevation' => 450
                ],
                'bottom-left' => [
                    'name' => 'Bottom Left',
                    'description' => 'Lower left corner view',
                    'pan_degrees' => -90,
                    'tilt_degrees' => -45,
                    'azimuth' => -900,
                    'elevation' => -450
                ],
                'bottom-right' => [
                    'name' => 'Bottom Right',
                    'description' => 'Lower right corner view',
                    'pan_degrees' => 90,
                    'tilt_degrees' => -45,
                    'azimuth' => 900,
                    'elevation' => -450
                ],
                'example-position' => [
                    'name' => 'Example Position',
                    'description' => 'Position from your curl example',
                    'pan_degrees' => 20,
                    'tilt_degrees' => -60,
                    'azimuth' => 200,
                    'elevation' => -600
                ]
            ];

            return response()->json([
                'success' => true,
                'available_positions' => $positions,
                'coordinate_system' => [
                    'azimuth_range' => [-1800, 1800],
                    'elevation_range' => [-900, 900],
                    'zoom_range' => [0, 100],
                    'note' => 'Hikvision uses 10x multiplier (e.g., 200 = 20.0 degrees)'
                ]
            ]);
        }

        /**
         * Batch absolute movements
         */
        public function batchAbsoluteMove(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'movements' => 'required|array|min:1',
                'movements.*.azimuth' => 'required|integer|between:-1800,1800',
                'movements.*.elevation' => 'required|integer|between:-900,900',
                'movements.*.zoom' => 'sometimes|integer|between:0,100',
                'movements.*.delay' => 'sometimes|integer|min:0|max:10000',
                'movements.*.name' => 'sometimes|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid batch movement parameters',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $cameraId = $request->input('camera_id');
                $movements = $request->input('movements');

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $results = [];
                foreach ($movements as $index => $movement) {
                    try {
                        // Add delay before movement (except first one)
                        if ($index > 0 && isset($movement['delay'])) {
                            usleep($movement['delay'] * 1000); // Convert ms to microseconds
                        }

                        $result = $this->executeAbsoluteMove($camera, [
                            'azimuth' => $movement['azimuth'],
                            'elevation' => $movement['elevation'],
                            'zoom' => $movement['zoom'] ?? 0
                        ]);

                        $results[] = [
                            'sequence' => $index + 1,
                            'name' => $movement['name'] ?? "Movement " . ($index + 1),
                            'success' => true,
                            'coordinates' => [
                                'azimuth' => $movement['azimuth'],
                                'elevation' => $movement['elevation'],
                                'zoom' => $movement['zoom'] ?? 0
                            ],
                            'result' => $result
                        ];

                    } catch (Exception $e) {
                        $results[] = [
                            'sequence' => $index + 1,
                            'name' => $movement['name'] ?? "Movement " . ($index + 1),
                            'success' => false,
                            'error' => $e->getMessage(),
                            'coordinates' => [
                                'azimuth' => $movement['azimuth'],
                                'elevation' => $movement['elevation'],
                                'zoom' => $movement['zoom'] ?? 0
                            ]
                        ];
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Batch absolute movement completed',
                    'total_movements' => count($movements),
                    'successful_movements' => count(array_filter($results, fn($r) => $r['success'])),
                    'results' => $results
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Batch movement failed: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Test connection to Hikvision camera
         */
        public function testConnection(string $cameraId): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);

                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Test basic connectivity first
                $basicTest = $this->testBasicConnectivity($camera);

                // Test PTZ capabilities
                $capabilitiesTest = $this->testPTZCapabilities($camera);

                // Test simple status request
                $statusTest = $this->testStatusRequest($camera);

                return response()->json([
                    'success' => true,
                    'camera_id' => $cameraId,
                    'camera_info' => [
                        'ip' => $camera['ip_address'],
                        'username' => $camera['username'],
                        'channel' => $camera['channel']
                    ],
                    'tests' => [
                        'basic_connectivity' => $basicTest,
                        'ptz_capabilities' => $capabilitiesTest,
                        'status_request' => $statusTest
                    ],
                    'overall_status' => $basicTest['success'] && $capabilitiesTest['success'] ? 'PASSED' : 'FAILED'
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection test failed: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Test basic connectivity
         */
        private function testBasicConnectivity(array $camera): array {
            try {
                // Simple ping-like test using device info endpoint
                $response = $this->sendCurlRequest(
                    "http://{$camera['ip_address']}/ISAPI/System/deviceInfo",
                    'GET',
                    '',
                    $camera['username'],
                    $camera['password']
                );

                return [
                    'success' => $response['status_code'] === 200,
                    'status_code' => $response['status_code'],
                    'message' => $response['status_code'] === 200 ? 'Connection successful' : 'Connection failed',
                    'response_preview' => substr($response['response_body'], 0, 200)
                ];

            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => 'Basic connectivity failed: ' . $e->getMessage(),
                    'error' => $e->getMessage()
                ];
            }
        }

        /**
         * Test PTZ capabilities
         */
        private function testPTZCapabilities(array $camera): array {
            try {
                $response = $this->sendHikvisionRequest($camera, 'GET', '/ISAPI/PTZCtrl/channels/1/capabilities');

                return [
                    'success' => $response['status_code'] === 200,
                    'status_code' => $response['status_code'],
                    'message' => $response['status_code'] === 200 ? 'PTZ capabilities retrieved' : 'PTZ capabilities failed',
                    'has_ptz' => strpos($response['response_body'], 'PTZ') !== false
                ];

            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => 'PTZ capabilities test failed: ' . $e->getMessage()
                ];
            }
        }

        /**
         * Test status request
         */
        private function testStatusRequest(array $camera): array {
            try {
                $response = $this->sendHikvisionRequest($camera, 'GET', '/ISAPI/PTZCtrl/channels/1/status');

                return [
                    'success' => $response['status_code'] === 200,
                    'status_code' => $response['status_code'],
                    'message' => $response['status_code'] === 200 ? 'Status request successful' : 'Status request failed',
                    'has_position_data' => strpos($response['response_body'], 'azimuth') !== false
                ];

            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => 'Status request failed: ' . $e->getMessage()
                ];
            }
        }

        /**
         * Debug absolute movement
         */
        public function debugAbsoluteMove(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'azimuth' => 'required|integer|between:-1800,1800',
                'elevation' => 'required|integer|between:-900,900',
                'zoom' => 'sometimes|integer|between:0,100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $cameraId = $request->input('camera_id');
                $azimuth = $request->input('azimuth');
                $elevation = $request->input('elevation');
                $zoom = $request->input('zoom', 0);

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Build the exact XML that will be sent
                $xmlData = "<PTZData>" .
                    "<AbsoluteHigh>" .
                    "<azimuth>{$azimuth}</azimuth>" .
                    "<elevation>{$elevation}</elevation>" .
                    "<absoluteZoom>{$zoom}</absoluteZoom>" .
                    "</AbsoluteHigh>" .
                    "</PTZData>";

                $url = "http://{$camera['ip_address']}/ISAPI/PTZCtrl/channels/{$camera['channel']}/absolute";

                // Show what will be sent
                $curlCommand = $this->generateCurlCommand($url, $xmlData, $camera['username'], $camera['password']);

                // Actually send the request
                $response = $this->sendHikvisionRequest($camera, 'PUT', '/ISAPI/PTZCtrl/channels/1/absolute', $xmlData);

                return response()->json([
                    'success' => $response['success'],
                    'debug_info' => [
                        'camera_config' => [
                            'ip' => $camera['ip_address'],
                            'username' => $camera['username'],
                            'channel' => $camera['channel']
                        ],
                        'request_details' => [
                            'url' => $url,
                            'method' => 'PUT',
                            'xml_payload' => $xmlData,
                            'equivalent_curl' => $curlCommand
                        ],
                        'input_parameters' => [
                            'azimuth' => $azimuth,
                            'elevation' => $elevation,
                            'zoom' => $zoom,
                            'degrees' => [
                                'pan' => $azimuth / 10.0,
                                'tilt' => $elevation / 10.0
                            ]
                        ]
                    ],
                    'response' => [
                        'status_code' => $response['status_code'],
                        'success' => $response['success'],
                        'body' => $response['response_body']
                    ],
                    'message' => $response['success'] ? 'Debug: Command sent successfully' : 'Debug: Command failed'
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debug failed: ' . $e->getMessage(),
                    'error_details' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Generate equivalent cURL command for debugging
         */
        private function generateCurlCommand(string $url, string $xmlData, string $username, string $password): string {
            $escapedXml = escapeshellarg($xmlData);
            $escapedCredentials = escapeshellarg($username . ':' . $password);

            return "curl --digest -u {$escapedCredentials} -H \"Content-Type: application/xml\" -X PUT {$url} -d {$escapedXml}";
        }

        /**
         * Get camera by ID (updated for Hikvision)
         */
        private function getCameraById(string $uid): ?array {
            // This should fetch from your database
            // Example implementation for Hikvision camera

            $platforms = Platforms::where('uid', '=', $uid)->first();

            return [
                'id' => $platforms->uid,
                'name' => 'Hikvision Camera ' . $platforms->uid,
                'ip_address' => $platforms->cctv_portal_ip, // Use your camera IP
                'username' => $platforms->cctv_portal_username,
                'password' => $platforms->cctv_portal_password,
                'channel' => 1,
                'supports_ptz' => true,
                'protocol' => 'hikvision_isapi',
                'model' => 'DS-2DE4A425IW-DE',
                'firmware_version' => 'V5.7.3'
            ];
        }
    }
