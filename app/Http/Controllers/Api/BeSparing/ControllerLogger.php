<?php

    namespace App\Http\Controllers\Api\BeSparing;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Master\Platform;
    use Exception;
    use Illuminate\Http\Request;

    class ControllerLogger extends Controller {

        //region Handle Pull Re Engineer
        public function handlePullReEngineer(Request $request) {
            try {
                $dataPlatform = Platform::select([
                    'uid',
                    'serial_number',
                    'tipe_logger'
                ])
                    ->where('serial_number', $request->input('serial_number'))
                    ->where('tipe_logger', '=', 2)
                    ->with(['paramRange', 'paramLimit'])->first();

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataPlatform,
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

    }
