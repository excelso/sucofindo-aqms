<?php

    namespace App\Http\Controllers\BeSparing\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Master\Platform;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class BeSparingControllerPlatform extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.reports.water-quality';
        }

        public function handlePlatformParamByIndustri(Request $request): JsonResponse {
            try {

                $dataPlatform = (new Platform)->where('uid', $request->input('platform_id'))->get()->first();
                return response()->json([
                    'message' => 'Success!',
                    'data' => json_decode($dataPlatform->site->customer->jenisIndustri->parameter, false),
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

    }
