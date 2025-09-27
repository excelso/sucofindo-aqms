<?php

    namespace App\Http\Controllers\BeSparing\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Master\Customer;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;

    class BeSparingControllerCustomer extends Controller {

        public function handleCustomerById(Request $request): JsonResponse {
            try {

                $dataCustomer = (new Customer)->where('id', $request->input('customer_id'))->with('site')->get()->first();
                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataCustomer,
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
