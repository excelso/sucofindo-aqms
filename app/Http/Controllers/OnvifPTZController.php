<?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Platforms;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Facades\Validator;

    class OnvifPTZController extends Controller {
        /**
         * Handle PTZ control commands for ONVIF cameras
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

                $result = $this->executeOnvifPTZCommand($camera, $action, $params);

                Log::info("ONVIF PTZ Command executed", [
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
                Log::error("ONVIF PTZ Command failed", [
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
         * Execute ONVIF PTZ command based on action
         */
        private function executeOnvifPTZCommand(array $camera, string $action, array $params): array {
            switch ($action) {
                case 'move':
                case 'continuous':
                    return $this->executeContinuousMove($camera, $params);

                case 'absolute':
                    return $this->executeAbsoluteMove($camera, $params);

                case 'relative':
                    return $this->executeRelativeMove($camera, $params);

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
         * Execute continuous movement command using ONVIF SOAP
         */
        private function executeContinuousMove(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $speed = floatval($params['speed'] ?? 0.5); // ONVIF uses normalized values between -1.0 and 1.0

            // Convert direction to ONVIF pan/tilt values
            $movements = [
                'up' => ['x' => 0, 'y' => $speed],
                'down' => ['x' => 0, 'y' => -$speed],
                'left' => ['x' => -$speed, 'y' => 0],
                'right' => ['x' => $speed, 'y' => 0],
                'up-left' => ['x' => -$speed, 'y' => $speed],
                'up-right' => ['x' => $speed, 'y' => $speed],
                'down-left' => ['x' => -$speed, 'y' => -$speed],
                'down-right' => ['x' => $speed, 'y' => -$speed]
            ];

            if (!isset($movements[$direction])) {
                throw new \InvalidArgumentException("Invalid direction: {$direction}");
            }

            $movement = $movements[$direction];

            // Build SOAP XML payload for continuous movement
            $soapEnvelope = $this->buildContinuousMoveSoap(
                $camera['profile_token'] ?? 'Profile_101',
                $movement['x'],
                $movement['y'],
                0 // zoom speed
            );

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'ContinuousMove');

            return [
                'status' => "Continuous moving {$direction}",
                'direction' => $direction,
                'pan_speed' => $movement['x'],
                'tilt_speed' => $movement['y'],
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute absolute movement command
         */
        private function executeAbsoluteMove(array $camera, array $params): array {
            $panPosition = floatval($params['pan'] ?? 0);      // Pan position (-1.0 to 1.0)
            $tiltPosition = floatval($params['tilt'] ?? 0);    // Tilt position (-1.0 to 1.0)
            $zoomPosition = floatval($params['zoom'] ?? 0);    // Zoom position (0.0 to 1.0)

            // Validate ONVIF ranges
            $panPosition = max(-1.0, min(1.0, $panPosition));
            $tiltPosition = max(-1.0, min(1.0, $tiltPosition));
            $zoomPosition = max(0.0, min(1.0, $zoomPosition));

            // Build SOAP XML payload for absolute movement
            $soapEnvelope = $this->buildAbsoluteMoveSoap(
                $camera['profile_token'] ?? 'Profile_101',
                $panPosition,
                $tiltPosition,
                $zoomPosition
            );

            Log::info($soapEnvelope);

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'AbsoluteMove');

            return [
                'status' => 'Moving to absolute position',
                'pan_position' => $panPosition,
                'tilt_position' => $tiltPosition,
                'zoom_position' => $zoomPosition,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute relative movement command
         */
        private function executeRelativeMove(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $step = floatval($params['step'] ?? 0.1); // Relative step size

            // Convert direction to relative movement values
            $movements = [
                'up' => ['x' => 0, 'y' => $step],
                'down' => ['x' => 0, 'y' => -$step],
                'left' => ['x' => -$step, 'y' => 0],
                'right' => ['x' => $step, 'y' => 0],
                'up-left' => ['x' => -$step, 'y' => $step],
                'up-right' => ['x' => $step, 'y' => $step],
                'down-left' => ['x' => -$step, 'y' => -$step],
                'down-right' => ['x' => $step, 'y' => -$step]
            ];

            if (!isset($movements[$direction])) {
                throw new \InvalidArgumentException("Invalid direction: {$direction}");
            }

            $movement = $movements[$direction];

            // Build SOAP XML payload for relative movement
            $soapEnvelope = $this->buildRelativeMoveSoap(
                $camera['profile_token'] ?? 'Profile_101',
                $movement['x'],
                $movement['y'],
                0 // zoom
            );

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'RelativeMove');

            return [
                'status' => "Moving {$direction} (relative)",
                'direction' => $direction,
                'pan_step' => $movement['x'],
                'tilt_step' => $movement['y'],
                'step_size' => $step,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Execute zoom command
         */
        private function executeZoom(array $camera, array $params): array {
            $direction = $params['direction'] ?? '';
            $speed = floatval($params['speed'] ?? 0.5);

            $zoomSpeed = $direction === 'in' ? $speed : -$speed;

            // Build SOAP XML payload for zoom
            $soapEnvelope = $this->buildContinuousMoveSoap(
                $camera['profile_token'] ?? 'Profile_101',
                0, // pan speed
                0, // tilt speed
                $zoomSpeed // zoom speed
            );

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'ContinuousMove');

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
            // Build SOAP XML payload to stop all movements
            $soapEnvelope = $this->buildContinuousMoveSoap(
                $camera['profile_token'] ?? 'Profile_101',
                0, // stop pan
                0, // stop tilt
                0  // stop zoom
            );

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'ContinuousMove');

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
            $presetToken = $params['preset_token'] ?? 'Preset1';
            $action = $params['action'] ?? 'goto'; // 'goto', 'set', 'remove'

            $soapAction = '';
            $soapEnvelope = '';

            switch ($action) {
                case 'goto':
                    $soapAction = 'GotoPreset';
                    $soapEnvelope = $this->buildGotoPresetSoap(
                        $camera['profile_token'] ?? 'Profile_101',
                        $presetToken
                    );
                    break;

                case 'set':
                    $soapAction = 'SetPreset';
                    $presetName = $params['name'] ?? $presetToken;
                    $soapEnvelope = $this->buildSetPresetSoap(
                        $camera['profile_token'] ?? 'Profile_101',
                        $presetToken,
                        $presetName
                    );
                    break;

                case 'remove':
                    $soapAction = 'RemovePreset';
                    $soapEnvelope = $this->buildRemovePresetSoap(
                        $camera['profile_token'] ?? 'Profile_101',
                        $presetToken
                    );
                    break;
            }

            $response = $this->sendOnvifRequest($camera, $soapEnvelope, $soapAction);

            return [
                'status' => "Preset {$action} {$presetToken}",
                'preset_token' => $presetToken,
                'action' => $action,
                'response' => $response,
                'timestamp' => now()->toISOString()
            ];
        }

        /**
         * Build SOAP envelope for continuous movement
         */
        private function buildContinuousMoveSoap(string $profileToken, float $panSpeed, float $tiltSpeed, float $zoomSpeed): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:ContinuousMove xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:Velocity>
                        <tt:PanTilt x="' . $panSpeed . '" y="' . $tiltSpeed . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                        <tt:Zoom x="' . $zoomSpeed . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                    </tptz:Velocity>
                </tptz:ContinuousMove>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Build SOAP envelope for absolute movement
         */
        private function buildAbsoluteMoveSoap(string $profileToken, float $pan, float $tilt, float $zoom): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:AbsoluteMove xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:Position>
                        <tt:PanTilt x="' . $pan . '" y="' . $tilt . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                        <tt:Zoom x="' . $zoom . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                    </tptz:Position>
                </tptz:AbsoluteMove>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Build SOAP envelope for relative movement
         */
        private function buildRelativeMoveSoap(string $profileToken, float $panDelta, float $tiltDelta, float $zoomDelta): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:RelativeMove xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:Translation>
                        <tt:PanTilt x="' . $panDelta . '" y="' . $tiltDelta . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                        <tt:Zoom x="' . $zoomDelta . '" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                    </tptz:Translation>
                </tptz:RelativeMove>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Build SOAP envelope for goto preset
         */
        private function buildGotoPresetSoap(string $profileToken, string $presetToken): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:GotoPreset xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:PresetToken>' . htmlspecialchars($presetToken) . '</tptz:PresetToken>
                </tptz:GotoPreset>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Build SOAP envelope for set preset
         */
        private function buildSetPresetSoap(string $profileToken, string $presetToken, string $presetName): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:SetPreset xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:PresetToken>' . htmlspecialchars($presetToken) . '</tptz:PresetToken>
                    <tptz:PresetName>' . htmlspecialchars($presetName) . '</tptz:PresetName>
                </tptz:SetPreset>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Build SOAP envelope for remove preset
         */
        private function buildRemovePresetSoap(string $profileToken, string $presetToken): string {
            return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header></s:Header>
            <s:Body>
                <tptz:RemovePreset xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                    <tptz:ProfileToken>' . htmlspecialchars($profileToken) . '</tptz:ProfileToken>
                    <tptz:PresetToken>' . htmlspecialchars($presetToken) . '</tptz:PresetToken>
                </tptz:RemovePreset>
            </s:Body>
        </s:Envelope>';
        }

        /**
         * Send SOAP request to ONVIF camera
         */
        private function sendOnvifRequest(array $camera, string $soapEnvelope, string $soapAction): array {
            $baseUrl = $camera['ip_address'];
            $username = $camera['username'];
            $password = $camera['password'];
            $ptzUrl = "http://{$baseUrl}/onvif/PTZ";

            try {
                $result = $this->sendSoapRequest($ptzUrl, $soapEnvelope, $soapAction, $username, $password);

                Log::info("ONVIF SOAP Request", [
                    'soap_action' => $soapAction,
                    'url' => $ptzUrl,
                    'status_code' => $result['status_code'],
                    'response_body' => $result['response_body']
                ]);

                return $result;

            } catch (Exception $e) {
                Log::error("ONVIF SOAP Request failed", [
                    'url' => $ptzUrl,
                    'soap_action' => $soapAction,
                    'error' => $e->getMessage()
                ]);

                throw new Exception("Failed to communicate with ONVIF camera: " . $e->getMessage());
            }
        }

        /**
         * Send SOAP request with proper authentication
         * @throws Exception
         */
        private function sendSoapRequest(string $url, string $soapEnvelope, string $soapAction, string $username, string $password): array {
            $ch = curl_init();

            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15, // Increased timeout
                CURLOPT_CONNECTTIMEOUT => 10, // Increased connect timeout
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $soapEnvelope,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_VERBOSE => false,

                // Authentication - try multiple methods
                CURLOPT_HTTPAUTH => CURLAUTH_ANY, // Try any auth method
                CURLOPT_USERPWD => $username . ':' . $password,

                // Headers
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/soap+xml; charset=utf-8',
                    'SOAPAction: "http://www.onvif.org/ver20/ptz/wsdl/' . $soapAction . '"',
                    'Content-Length: ' . strlen($soapEnvelope),
                    'Accept: application/soap+xml, application/xml, text/xml',
                    'User-Agent: ONVIF-PTZ-Client/1.0',
                    'Connection: keep-alive'
                ]
            ]);

            $response = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            $curlInfo = curl_getinfo($ch);

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

                // Build SOAP envelope for getting status
                $soapEnvelope = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                <s:Header></s:Header>
                <s:Body>
                    <tptz:GetStatus xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                        <tptz:ProfileToken>' . htmlspecialchars($camera['profile_token'] ?? 'Profile_101') . '</tptz:ProfileToken>
                    </tptz:GetStatus>
                </s:Body>
            </s:Envelope>';

                $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'GetStatus');

                return response()->json([
                    'success' => true,
                    'status' => $this->parseOnvifStatus($response['response_body']),
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
         * Parse ONVIF status SOAP response
         */
        private function parseOnvifStatus(string $soapResponse): array {
            try {
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($soapResponse);

                if ($xml === false) {
                    $errors = libxml_get_errors();
                    throw new Exception('XML parsing failed: ' . implode(', ', array_map(fn($e) => $e->message, $errors)));
                }

                // Register namespaces
                $xml->registerXPathNamespace('s', 'http://www.w3.org/2003/05/soap-envelope');
                $xml->registerXPathNamespace('tptz', 'http://www.onvif.org/ver20/ptz/wsdl');
                $xml->registerXPathNamespace('tt', 'http://www.onvif.org/ver10/schema');

                // Extract position data
                $position = $xml->xpath('//tptz:GetStatusResponse/tptz:PTZStatus/tt:Position')[0] ?? null;

                if ($position) {
                    $panTilt = $position->xpath('tt:PanTilt')[0] ?? null;
                    $zoom = $position->xpath('tt:Zoom')[0] ?? null;

                    return [
                        'pan_position' => floatval($panTilt['x'] ?? 0),
                        'tilt_position' => floatval($panTilt['y'] ?? 0),
                        'zoom_position' => floatval($zoom['x'] ?? 0),
                        'timestamp' => now()->toISOString()
                    ];
                }

                return [
                    'pan_position' => 0,
                    'tilt_position' => 0,
                    'zoom_position' => 0,
                    'timestamp' => now()->toISOString()
                ];

            } catch (Exception $e) {
                return [
                    'error' => 'Failed to parse status response',
                    'message' => $e->getMessage(),
                    'raw_response' => $soapResponse
                ];
            }
        }

        /**
         * Test ONVIF connection
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

                // Test basic ONVIF connectivity
                $connectivityTest = $this->testOnvifConnectivity($camera);

                // Test PTZ capabilities
                $capabilitiesTest = $this->testOnvifCapabilities($camera);

                return response()->json([
                    'success' => true,
                    'camera_id' => $cameraId,
                    'camera_info' => [
                        'ip' => $camera['ip_address'],
                        'username' => $camera['username'],
                        'profile_token' => $camera['profile_token'] ?? 'Profile_101'
                    ],
                    'tests' => [
                        'onvif_connectivity' => $connectivityTest,
                        'ptz_capabilities' => $capabilitiesTest
                    ],
                    'overall_status' => $connectivityTest['success'] && $capabilitiesTest['success'] ? 'PASSED' : 'FAILED'
                ], 200, [], JSON_PRETTY_PRINT);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection test failed: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Test ONVIF connectivity
         */
        private function testOnvifConnectivity(array $camera): array {
            try {
                $soapEnvelope = '
                    <?xml version="1.0" encoding="UTF-8"?>
                    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                        <s:Header></s:Header>
                        <s:Body>
                            <tds:GetDeviceInformation xmlns:tds="http://www.onvif.org/ver10/device/wsdl"/>
                        </s:Body>
                    </s:Envelope>
                ';

                $deviceUrl = "http://{$camera['ip_address']}/onvif/device_service";
                $response = $this->sendSoapRequest($deviceUrl, $soapEnvelope, 'GetDeviceInformation', $camera['username'], $camera['password']);

                return [
                    'success' => $response['status_code'] === 200,
                    'status_code' => $response['status_code'],
                    'message' => $response['status_code'] === 200 ? 'ONVIF connection successful' : 'ONVIF connection failed'
                ];

            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => 'ONVIF connectivity failed: ' . $e->getMessage()
                ];
            }
        }

        /**
         * Test ONVIF PTZ capabilities
         */
        private function testOnvifCapabilities(array $camera): array {
            try {
                $soapEnvelope = '
                <?xml version="1.0" encoding="utf-8"?>
                <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                    <s:Header></s:Header>
                    <s:Body>
                        <tptz:GetNodes xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl"/>
                    </s:Body>
                </s:Envelope>
                ';

                $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'GetNodes');

                return [
                    'success' => $response['status_code'] === 200,
                    'status_code' => $response['status_code'],
                    'message' => $response['status_code'] === 200 ? 'PTZ capabilities retrieved' : 'PTZ capabilities failed'
                ];

            } catch (Exception $e) {
                return [
                    'success' => false,
                    'message' => 'PTZ capabilities test failed: ' . $e->getMessage()
                ];
            }
        }

        /**
         * Absolute movement with specific endpoint
         */
        public function absoluteMove(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'pan' => 'required|numeric|between:-1,1',
                'tilt' => 'required|numeric|between:-1,1',
                'zoom' => 'sometimes|numeric|between:0,1'
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
                $pan = $request->input('pan');
                $tilt = $request->input('tilt');
                $zoom = $request->input('zoom', 0);

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executeAbsoluteMove($camera, [
                    'pan' => $pan,
                    'tilt' => $tilt,
                    'zoom' => $zoom
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Absolute movement executed successfully',
                    'data' => $result
                ]);

            } catch (Exception $e) {
                Log::error("ONVIF Absolute movement failed", [
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
         * Move using degrees (converts to normalized values)
         */
        public function moveToDegrees(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'pan_degrees' => 'required|numeric|between:-180,180',
                'tilt_degrees' => 'required|numeric|between:-90,90',
                'zoom_percentage' => 'sometimes|numeric|between:0,100'
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
                $zoomPercentage = $request->input('zoom_percentage', 0);

                // Convert degrees to ONVIF normalized values
                $pan = max(-1.0, min(1.0, $panDegrees / 180));
                $tilt = max(-1.0, min(1.0, $tiltDegrees / 90));
                $zoom = max(0.0, min(1.0, $zoomPercentage / 100));

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executeAbsoluteMove($camera, [
                    'pan' => $pan,
                    'tilt' => $tilt,
                    'zoom' => $zoom
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Camera moved to specified degrees',
                    'input_degrees' => [
                        'pan' => $panDegrees,
                        'tilt' => $tiltDegrees,
                        'zoom' => $zoomPercentage
                    ],
                    'normalized_values' => [
                        'pan' => $pan,
                        'tilt' => $tilt,
                        'zoom' => $zoom
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
         * Goto preset
         */
        public function gotoPreset(string $cameraId, string $presetToken): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executePreset($camera, [
                    'action' => 'goto',
                    'preset_token' => $presetToken
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Moving to preset: {$presetToken}",
                    'preset_token' => $presetToken,
                    'data' => $result
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to goto preset: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Set preset
         */
        public function setPreset(Request $request, string $cameraId, string $presetToken): JsonResponse {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters',
                    'errors' => $validator->errors()
                ], 400);
            }

            try {
                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executePreset($camera, [
                    'action' => 'set',
                    'preset_token' => $presetToken,
                    'name' => $request->input('name', $presetToken)
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Preset {$presetToken} set successfully",
                    'preset_token' => $presetToken,
                    'data' => $result
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to set preset: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Remove preset
         */
        public function removePreset(string $cameraId, string $presetToken): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                $result = $this->executePreset($camera, [
                    'action' => 'remove',
                    'preset_token' => $presetToken
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Preset {$presetToken} removed successfully",
                    'preset_token' => $presetToken,
                    'data' => $result
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to remove preset: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Get camera presets
         */
        public function getPresets(string $cameraId): JsonResponse {
            try {
                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Build SOAP envelope for getting presets
                $soapEnvelope = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                <s:Header></s:Header>
                <s:Body>
                    <tptz:GetPresets xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
                        <tptz:ProfileToken>' . htmlspecialchars($camera['profile_token'] ?? 'Profile_101') . '</tptz:ProfileToken>
                    </tptz:GetPresets>
                </s:Body>
            </s:Envelope>';

                $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'GetPresets');

                return response()->json([
                    'success' => true,
                    'presets' => $this->parseOnvifPresets($response['response_body']),
                    'raw_response' => $response
                ]);

            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get presets: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Parse ONVIF presets SOAP response
         */
        private function parseOnvifPresets(string $soapResponse): array {
            try {
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($soapResponse);

                if ($xml === false) {
                    return [];
                }

                // Register namespaces
                $xml->registerXPathNamespace('s', 'http://www.w3.org/2003/05/soap-envelope');
                $xml->registerXPathNamespace('tptz', 'http://www.onvif.org/ver20/ptz/wsdl');
                $xml->registerXPathNamespace('tt', 'http://www.onvif.org/ver10/schema');

                // Extract presets
                $presets = $xml->xpath('//tptz:GetPresetsResponse/tptz:Preset') ?: [];
                $parsedPresets = [];

                //     foreach ($presets as $preset) {
                //         $parsedPresets[] = [
                //             'token' => (string)$preset['token'],
                //             'name' => (string)$preset->tt:Name,
                //             'position' => [
                //             'pan' => floatval($preset->tt:PTZPosition->tt:PanTilt['x'] ?? 0),
                //             'tilt' => floatval($preset->tt:PTZPosition->tt:PanTilt['y'] ?? 0),
                //             'zoom' => floatval($preset->tt:PTZPosition->tt:Zoom['x'] ?? 0)
                //         ]
                //     ];
                // }

                return $parsedPresets;

            } catch (Exception $e) {
                return [];
            }
        }

        /**
         * Get camera capabilities
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

                // Build SOAP envelope for getting capabilities
                $soapEnvelope = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                <s:Header></s:Header>
                <s:Body>
                    <tptz:GetServiceCapabilities xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl"/>
                </s:Body>
            </s:Envelope>';

                $response = $this->sendOnvifRequest($camera, $soapEnvelope, 'GetServiceCapabilities');

                return response()->json([
                    'success' => true,
                    'capabilities' => $this->parseOnvifCapabilities($response['response_body']),
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
         * Parse ONVIF capabilities SOAP response
         */
        private function parseOnvifCapabilities(string $soapResponse): array {
            try {
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($soapResponse);

                if ($xml === false) {
                    return $this->getDefaultCapabilities();
                }

                // Register namespaces
                $xml->registerXPathNamespace('s', 'http://www.w3.org/2003/05/soap-envelope');
                $xml->registerXPathNamespace('tptz', 'http://www.onvif.org/ver20/ptz/wsdl');
                $xml->registerXPathNamespace('tt', 'http://www.onvif.org/ver10/schema');

                // Extract capabilities (implementation depends on camera response format)
                return [
                    'supports_pan' => true,
                    'supports_tilt' => true,
                    'supports_zoom' => true,
                    'supports_presets' => true,
                    'supports_absolute' => true,
                    'supports_relative' => true,
                    'supports_continuous' => true,
                    'coordinate_system' => 'normalized',
                    'pan_range' => [-1.0, 1.0],
                    'tilt_range' => [-1.0, 1.0],
                    'zoom_range' => [0.0, 1.0],
                    'protocol' => 'ONVIF'
                ];

            } catch (Exception $e) {
                return $this->getDefaultCapabilities();
            }
        }

        /**
         * Get default capabilities for ONVIF cameras
         */
        private function getDefaultCapabilities(): array {
            return [
                'supports_pan' => true,
                'supports_tilt' => true,
                'supports_zoom' => true,
                'supports_presets' => true,
                'supports_absolute' => true,
                'supports_relative' => true,
                'supports_continuous' => true,
                'coordinate_system' => 'normalized',
                'pan_range' => [-1.0, 1.0],
                'tilt_range' => [-1.0, 1.0],
                'zoom_range' => [0.0, 1.0],
                'protocol' => 'ONVIF'
            ];
        }

        /**
         * Debug ONVIF command
         */
        public function debugCommand(Request $request): JsonResponse {
            $validator = Validator::make($request->all(), [
                'camera_id' => 'required|string',
                'action' => 'required|string',
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
                $cameraId = $request->input('camera_id');
                $action = $request->input('action');
                $params = $request->input('params', []);

                $camera = $this->getCameraById($cameraId);
                if (!$camera) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Camera not found'
                    ], 404);
                }

                // Generate the SOAP envelope that would be sent
                $soapEnvelope = '';
                $soapAction = '';
                $endpoint = "http://{$camera['ip_address']}/onvif/PTZ";

                switch ($action) {
                    case 'continuous':
                        $direction = $params['direction'] ?? 'up';
                        $speed = floatval($params['speed'] ?? 0.5);
                        $movements = [
                            'up' => ['x' => 0, 'y' => $speed],
                            'down' => ['x' => 0, 'y' => -$speed],
                            'left' => ['x' => -$speed, 'y' => 0],
                            'right' => ['x' => $speed, 'y' => 0]
                        ];
                        $movement = $movements[$direction] ?? $movements['up'];

                        $soapEnvelope = $this->buildContinuousMoveSoap(
                            $camera['profile_token'] ?? 'Profile_101',
                            $movement['x'],
                            $movement['y'],
                            0
                        );
                        $soapAction = 'ContinuousMove';
                        break;

                    case 'absolute':
                        $pan = floatval($params['pan'] ?? 0);
                        $tilt = floatval($params['tilt'] ?? 0);
                        $zoom = floatval($params['zoom'] ?? 0);

                        $soapEnvelope = $this->buildAbsoluteMoveSoap(
                            $camera['profile_token'] ?? 'Profile_101',
                            $pan,
                            $tilt,
                            $zoom
                        );
                        $soapAction = 'AbsoluteMove';
                        break;

                    case 'stop':
                        $soapEnvelope = $this->buildContinuousMoveSoap(
                            $camera['profile_token'] ?? 'Profile_101',
                            0, 0, 0
                        );
                        $soapAction = 'ContinuousMove';
                        break;
                }

                // Generate equivalent cURL command
                $curlCommand = $this->generateSoapCurlCommand($endpoint, $soapEnvelope, $soapAction, $camera['username'], $camera['password']);

                // Actually send the request
                $response = $this->sendOnvifRequest($camera, $soapEnvelope, $soapAction);

                return response()->json([
                    'success' => $response['success'],
                    'debug_info' => [
                        'camera_config' => [
                            'ip' => $camera['ip_address'],
                            'username' => $camera['username'],
                            'profile_token' => $camera['profile_token'] ?? 'Profile_101'
                        ],
                        'request_details' => [
                            'endpoint' => $endpoint,
                            'soap_action' => $soapAction,
                            'soap_envelope' => $soapEnvelope,
                            'equivalent_curl' => $curlCommand
                        ],
                        'input_parameters' => [
                            'action' => $action,
                            'params' => $params
                        ]
                    ],
                    'response' => [
                        'status_code' => $response['status_code'],
                        'success' => $response['success'],
                        'body' => $response['response_body']
                    ],
                    'message' => $response['success'] ? 'Debug: ONVIF command sent successfully' : 'Debug: ONVIF command failed'
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
         * Generate equivalent cURL command for SOAP debugging
         */
        private function generateSoapCurlCommand(string $url, string $soapEnvelope, string $soapAction, string $username, string $password): string {
            $escapedSoap = escapeshellarg($soapEnvelope);
            $escapedCredentials = escapeshellarg($username . ':' . $password);
            $soapActionHeader = escapeshellarg("http://www.onvif.org/ver20/ptz/wsdl/{$soapAction}");

            return "curl --digest -u {$escapedCredentials} " .
                "-H \"Content-Type: application/soap+xml\" " .
                "-H \"SOAPAction: {$soapActionHeader}\" " .
                "-X POST {$url} -d {$escapedSoap}";
        }

        /**
         * Get camera by ID (updated for ONVIF)
         */
        private function getCameraById(string $uid): ?array {
            $platforms = Platforms::where('uid', '=', $uid)->first();

            if (!$platforms) {
                return null;
            }

            return [
                'id' => $platforms->uid,
                'name' => 'ONVIF Camera ' . $platforms->uid,
                'ip_address' => $platforms->cctv_portal_ip,
                'username' => $platforms->cctv_portal_username,
                'password' => $platforms->cctv_portal_password,
                'profile_token' => 'Profile_101', // Default profile token, bisa disesuaikan
                'supports_ptz' => true,
                'protocol' => 'onvif',
                'model' => 'ONVIF PTZ Camera'
            ];
        }
    }
