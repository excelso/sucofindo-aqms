<?php

    namespace App\Http\Controllers\Settings;

    use App\Http\Controllers\Controller;
    use GuzzleHttp\Client;
    use Illuminate\Http\Request;
    use Log;

    class WebRTCProxyController extends Controller {
        private Client $client;

        public function __construct() {
            $this->client = new Client([
                'timeout' => 30,
                'connect_timeout' => 10,
                'verify' => false, // Disable SSL verification for internal services
                'http_errors' => false // Don't throw exceptions on HTTP errors
            ]);
        }

        /**
         * Proxy GET requests untuk WebRTC iframe
         */
        public function proxyGet(Request $request) {
            $streamUrl = $request->query('stream');

            if (!$streamUrl) {
                return response('Stream URL required', 400)
                    ->header('Content-Type', 'text/plain');
            }

            // Validate and sanitize URL
            if (!$this->isValidWebRTCUrl($streamUrl)) {
                return response('Invalid WebRTC URL', 400)
                    ->header('Content-Type', 'text/plain');
            }

            try {
                Log::info('WebRTC Proxy GET request', ['url' => $streamUrl]);

                $response = $this->client->post($streamUrl, [
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (compatible; WebRTC-Proxy/1.0)',
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    ]
                ]);

                $statusCode = $response->getStatusCode();
                $contentType = $response->getHeaderLine('Content-Type') ?: 'text/html';
                $body = $response->getBody()->getContents();

                Log::info('WebRTC Proxy response', [
                    'status' => $statusCode,
                    'content_type' => $contentType,
                    'body_length' => strlen($body)
                ]);

                // Modify HTML content to work in HTTPS context
                if (strpos($contentType, 'text/html') !== false) {
                    $body = $this->modifyWebRTCHtml($body);
                }

                return response($body, $statusCode)
                    ->header('Content-Type', $contentType)
                    ->header('X-Frame-Options', 'SAMEORIGIN')
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type')
                    ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    ->header('Pragma', 'no-cache')
                    ->header('Expires', '0');

            } catch (RequestException $e) {
                Log::error('WebRTC Proxy Error', [
                    'url' => $streamUrl,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);

                $errorMsg = 'WebRTC stream unavailable: ' . $e->getMessage();

                // Return HTML error page instead of plain text
                $errorHtml = $this->generateErrorPage($errorMsg, $streamUrl);

                return response($errorHtml, 503)
                    ->header('Content-Type', 'text/html');
            }
        }

        /**
         * Proxy POST requests untuk WHEP endpoint
         */
        public function proxyWhep(Request $request) {
            $targetUrl = $request->query('url');

            if (!$targetUrl) {
                return response('Target URL required', 400);
            }

            if (!$this->isValidWebRTCUrl($targetUrl)) {
                return response('Invalid WHEP URL', 400);
            }

            try {
                Log::info('WebRTC WHEP Proxy request', ['url' => $targetUrl]);

                $response = $this->client->post($targetUrl, [
                    'headers' => [
                        'Content-Type' => 'application/sdp',
                        'User-Agent' => 'Mozilla/5.0 (compatible; WebRTC-Proxy/1.0)',
                    ],
                    'body' => $request->getContent()
                ]);

                $statusCode = $response->getStatusCode();
                $body = $response->getBody()->getContents();
                $contentType = $response->getHeaderLine('Content-Type') ?: 'application/sdp';

                Log::info('WebRTC WHEP response', [
                    'status' => $statusCode,
                    'content_type' => $contentType,
                    'body_length' => strlen($body)
                ]);

                return response($body, $statusCode)
                    ->header('Content-Type', $contentType)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type');

            } catch (RequestException $e) {
                Log::error('WebRTC WHEP Proxy Error', [
                    'url' => $targetUrl,
                    'error' => $e->getMessage()
                ]);

                return response('WHEP request failed: ' . $e->getMessage(), 503);
            }
        }

        /**
         * Validate WebRTC URL
         */
        private function isValidWebRTCUrl(string $url): bool {
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                return false;
            }

            $parsed = parse_url($url);

            // Only allow specific WebRTC server
            $allowedHosts = ['103.127.132.72'];
            $allowedPorts = [8889, 8888];

            return in_array($parsed['host'] ?? '', $allowedHosts) &&
                in_array($parsed['port'] ?? 80, $allowedPorts);
        }

        /**
         * Modify HTML content untuk compatibility
         */
        private function modifyWebRTCHtml(string $html): string {
            // Replace HTTP URLs with HTTPS where possible
            $html = str_replace('http://', 'https://', $html);

            // Add meta tags for better security
            $metaTags = '
                <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
                <meta name="referrer" content="no-referrer-when-downgrade">
            ';

            if (strpos($html, '<head>') !== false) {
                $html = str_replace('<head>', '<head>' . $metaTags, $html);
            }

            return $html;
        }

        /**
         * Generate error page untuk debugging
         */
        private function generateErrorPage(string $error, string $url): string {
            return "
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WebRTC Connection Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                        .error-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .error-title { color: #d32f2f; margin-bottom: 16px; }
                        .error-message { color: #666; margin-bottom: 16px; }
                        .error-details { background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; }
                        .retry-btn { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class='error-container'>
                        <h2 class='error-title'>WebRTC Connection Failed</h2>
                        <p class='error-message'>Unable to establish connection to WebRTC stream.</p>
                        <div class='error-details'>
                            <strong>Error:</strong> " . htmlspecialchars($error) . "<br>
                            <strong>URL:</strong> " . htmlspecialchars($url) . "<br>
                            <strong>Time:</strong> " . date('Y-m-d H:i:s') . "
                        </div>
                        <button class='retry-btn' onclick='window.location.reload()'>Retry Connection</button>
                    </div>
                </body>
                </html>
            ";
        }
    }
