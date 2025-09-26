<?php

    namespace App\Http\Controllers\Auth;

    use App\Http\Controllers\Controller;
    use App\Mail\MailRequestOTP;
    use App\Models\RequestOTP;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Mail;
    use Throwable;

    class VerifyOTPController extends Controller {
        public function index() {
            // Jika sudah verify OTP, redirect ke dashboard
            if (session()->has('otp_verified')) {
                return redirect()->route('aqms.dashboard');
            }

            if (!auth()->check()) {
                session()->forget('otp_verified');
                return redirect()->route('login');
            }

            return view('auth.verify-otp');
        }

        //region Handle Verify OTP
        public function verifyOTP(Request $request) {
            try {

                $dataOTP = RequestOTP::where('email', $request->input('email'))
                    ->where('otp_token', $request->input('otp_token'))
                    ->where('expired_at', '>', Carbon::now()->timezone(config('app.timezone'))->format('Y-m-d H:i:s'))
                    ->first();

                if (!$dataOTP) {
                    return response()->json([
                        'message' => 'Kode OTP Tidak Valid!',
                        'time' => Carbon::now()->timezone(config('app.timezone')),
                        'responseTime' => now()
                    ], 500);
                }

                // Jika OTP Valid, maka dihapus!
                $dataOTP->delete();

                session(['otp_verified' => true]);

                return response()->json([
                    'message' => 'Verify OTP Success!',
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
        //endregion

        //region Handle Send OTP
        public function sendOTP(Request $request) {
            try {

                $sendMail = $this->sendMailOTP($request);

                if ($sendMail['status'] == 'error') {
                    return response()->json([
                        'message' => $sendMail['message'],
                        'code' => $sendMail['code'],
                        'responseTime' => now()
                    ], 500);
                }

                return response()->json([
                    'message' => 'Permintaan OTP berhasil dikirim!',
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
        //endregion

        //region Handle Resend OTP
        public function resendOTP(Request $request) {
            try {

                RequestOTP::where('email', $request->input('email'))
                    ->where('device_platform', '=', 'web')
                    ->where('expired_at', '<', Carbon::now()->timezone(config('app.timezone'))->format('Y-m-d H:i:s'))
                    ->delete();

                $sendMail = $this->sendMailOTP($request);

                if ($sendMail['status'] == 'error') {
                    return response()->json([
                        'message' => $sendMail['message'],
                        'code' => $sendMail['code'],
                        'responseTime' => now()
                    ], 500);
                }

                return response()->json([
                    'message' => 'Permintaan OTP baru berhasil dikirim!',
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
        //endregion

        //region Handle Send Email OTP
        private function sendMailOTP(Request $request) {
            try {

                $otpToken = '';
                for ($i = 0; $i < 6; $i++) {
                    $otpToken .= random_int(1, 9); // Hanya menggunakan angka 1-9
                }

                RequestOTP::create([
                    'email' => $request->input('email'),
                    'otp_token' => $otpToken,
                    'device_platform' => 'Web',
                    'device_brand' => $request->header('User-Agent'),
                    'expired_at' => Carbon::now()->timezone('Asia/Makassar')->addMinutes()
                ]);

                Mail::to($request->input('email'))->send(new MailRequestOTP('BeAQMS - Verify Login', [
                    'otpToken' => $otpToken,
                    'device_platform' => 'Web',
                    'device_brand' => $request->header('User-Agent'),
                    'device_name' => '-'
                ], []));

                return [
                    'status' => 'success',
                ];

            } catch (Exception $exception) {
                return [
                    'status' => 'error',
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ];
            } catch (Throwable $exception) {
                return [
                    'status' => 'error',
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ];
            }
        }
        //endregion
    }
