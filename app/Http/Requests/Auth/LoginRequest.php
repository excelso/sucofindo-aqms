<?php

    namespace App\Http\Requests\Auth;

    use App\Models\Users\User;
    use Carbon\Carbon;
    use Illuminate\Auth\Events\Lockout;
    use Illuminate\Foundation\Http\FormRequest;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\RateLimiter;
    use Illuminate\Support\Facades\Session;
    use Illuminate\Support\Str;
    use Illuminate\Validation\ValidationException;

    class LoginRequest extends FormRequest {
        /**
         * Determine if the user is authorized to make this request.
         */
        public function authorize(): bool {
            return true;
        }

        /**
         * Get the validation rules that apply to the request.
         *
         * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
         */
        public function rules(): array {
            return [
                'email' => [
                    'required'
                ],
                'password' => [
                    'required',
                    'string',
                ],
            ];
        }

        /**
         * Attempt to authenticate the request's credentials.
         *
         * @throws \Illuminate\Validation\ValidationException
         */
        public function authenticate(): void {
            $this->ensureIsNotRateLimited();

            if (!Auth::attempt($this->only('email', 'password'), $this->input('remember'))) {
                RateLimiter::hit($this->throttleKey());

                throw ValidationException::withMessages([
                    'login-failed' => trans('auth.failed'),
                ]);
            } else {
                $user = (new User)->select('t_users.*')
                    ->where('email', $this->input('email'))
                    ->orWhere('sid_code', $this->input('email'))
                    ->where('t_users.status_user', 'Active')
                    ->get()->first();

                (new User)->where('email', $this->input('email'))->update([
                    'last_login' => Carbon::now()
                ]);

                if ($user == null) {
                    throw ValidationException::withMessages([
                        'login-failed' => 'Akun anda telah di nonaktifkan!'
                    ]);
                }
            }

            RateLimiter::clear($this->throttleKey());
        }

        /**
         * Ensure the login request is not rate limited.
         *
         * @throws \Illuminate\Validation\ValidationException
         */
        public function ensureIsNotRateLimited(): void {
            if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
                return;
            }

            event(new Lockout($this));

            $seconds = RateLimiter::availableIn($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.throttle', [
                    'seconds' => $seconds,
                    'minutes' => ceil($seconds / 60),
                ]),
            ]);
        }

        /**
         * Get the rate limiting throttle key for the request.
         */
        public function throttleKey(): string {
            return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
        }
    }
