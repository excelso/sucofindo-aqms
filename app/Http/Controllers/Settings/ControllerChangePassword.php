<?php

    namespace App\Http\Controllers\Settings;

    use App\Http\Controllers\Controller;
    use App\Models\Users\User;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rules\Password;
    use Illuminate\View\View;

    class ControllerChangePassword extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/settings/change-password';
        }

        public function index(): View {
            return view($this->viewPath . '/index');
        }

        public function updatePassword(Request $request): JsonResponse {
            try {

                $validate = Validator::make($request->all(), [
                    'password_lama' => 'required',
                    'password_baru' => [
                        Password::min(8)
                            ->mixedCase()
                    ],
                    're_password_baru' => 'min:8|required_with:password_baru|same:password_baru',
                ], [], [
                    'password_lama' => 'Old Password',
                    'password_baru' => 'New Password',
                    're_password_baru' => 'Confirm New Password',
                ]);

                if ($validate->fails()) {
                    return response()->json([
                        'errorValidation' => $validate->errors(), 'responseTime' => Carbon::now(),
                    ], 401);
                }

                $userExist = (new User)->where('email', $request->user()->email)->get()->first();
                if ($userExist) {
                    if (!Hash::check($request->input('password_lama'), $userExist->password)) {
                        return response()->json([
                            'errorValidation' => ['password_lama' => ['Old Password not match']],
                            'responseTime' => Carbon::now(),
                        ], 401);
                    }
                }

                (new User)->where('email', $request->user()->email)
                    ->update(['password' => Hash::make($request->input('re_password_baru'))]);

                return response()->json([
                    'message' => 'Change Password Success',
                    'responseTime' => Carbon::now(),
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => Carbon::now(),
                ], 500);
            }
        }

    }
