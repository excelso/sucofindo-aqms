<?php

    namespace App\Providers;

    use App\Models\Users\User;
    use Exception;
    use Illuminate\Auth\GenericUser;
    use Illuminate\Contracts\Auth\Authenticatable;
    use Illuminate\Contracts\Auth\UserProvider;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Http;
    use Illuminate\Support\Facades\Log;

    class ExternalApiUserProvider implements UserProvider {
        /**
         * @inheritDoc
         */
        public function retrieveById($identifier): ?Authenticatable {
            return User::where('id', $identifier)
                ->where('status_user', 'Active')
                ->first();
        }

        /**
         * @inheritDoc
         */
        public function retrieveByToken($identifier, $token): ?Authenticatable {
            return User::where('id', $identifier)
                ->where('remember_token', $token)
                ->where('status_user', 'Active')
                ->first();
        }

        /**
         * @inheritDoc
         */
        public function updateRememberToken(Authenticatable $user, $token): void {
            $user->setRememberToken($token);
            $user->save();
        }

        /**
         * @inheritDoc
         */
        public function retrieveByCredentials(array $credentials): ?Authenticatable {
            if (!array_key_exists('email', $credentials)) {
                return null;
            }

            return User::where(function ($query) use ($credentials) {
                $query->where('email', $credentials['email'])
                    ->orWhere('sid_code', $credentials['email']);
            })
                ->where('status_user', 'Active')
                ->first();
        }

        /**
         * @inheritDoc
         */
        public function validateCredentials(Authenticatable $user, array $credentials): bool {
            try {
                // User tipe 1 menggunakan external API
                if ($user->tipe_user == 1) {
                    return $this->validateExternalApi($credentials);
                }

                // User tipe lain menggunakan hash password lokal
                return Hash::check($credentials['password'], $user->getAuthPassword());

            } catch (Exception $exception) {
                Log::error('Authentication error: ' . $exception->getMessage(), [
                    'user_id' => $user->getAuthIdentifier(),
                    'email' => $credentials['email'] ?? 'unknown'
                ]);
                return false;
            }
        }

        /**
         * Validate credentials against external API
         */
        private function validateExternalApi(array $credentials): bool {
            try {
                $response = Http::timeout(30)
                    ->post('http://hseautomation.beraucoal.co.id/beats/api/mobile/login', [
                        'username' => $credentials['email'],
                        'password' => $credentials['password']
                    ]);

                if ($response->failed()) {
                    Log::warning('External API login failed', [
                        'status' => $response->status(),
                        'username' => $credentials['email']
                    ]);
                    return false;
                }

                $responseData = $response->json();

                return isset($responseData['id']) && !empty($responseData['id']);

            } catch (Exception $e) {
                Log::error('External API connection error: ' . $e->getMessage());
                return false;
            }
        }

        /**
         * @inheritDoc
         */
        public function rehashPasswordIfRequired(Authenticatable $user, #[\SensitiveParameter] array $credentials, bool $force = false): void {
            // Implementasi jika diperlukan untuk rehashing password
            if ($user->tipe_user != 1 && Hash::needsRehash($user->getAuthPassword())) {
                $user->password = Hash::make($credentials['password']);
                $user->save();
            }
        }
    }
