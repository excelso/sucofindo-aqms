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
            return (new User)->where('t_users.id', $identifier)
                ->select('t_users.*')
                ->where('t_users.status_user', 'Active')
                ->get()->first();
        }

        /**
         * @inheritDoc
         */
        public function retrieveByToken($identifier, $token): ?Authenticatable {
            $userExist = (new User)->where('t_users.id', $identifier)->where('remember_token', $token);
            if ($userExist->count() > 0) {
                return $userExist->select('t_users.*')
                    ->where('t_users.status_user', 'Active')
                    ->get()->first();
            }
            return null;
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
        public function retrieveByCredentials(array $credentials): GenericUser|Authenticatable|null {
            if (!array_key_exists('email', $credentials)) {
                return null;
            }

            $userExist = (new User)->where('email', $credentials['email'])
                ->orWhere('sid_code', $credentials['email']);
            if ($userExist->count() > 0) {
                return $userExist->select('t_users.*')
                    ->where('t_users.status_user', 'Active')
                    ->get()->first();
            }
            return null;
        }

        /**
         * @inheritDoc
         */
        public function validateCredentials(Authenticatable $user, array $credentials): string|bool {
            try {
                if ($user->tipe_user == 1) {
                    $reqLogin = Http::timeout(30)
                        ->withBody(json_encode([
                            'username' => $credentials['email'],
                            'password' => $credentials['password']
                        ]), 'application/json')
                        ->post('http://hseautomation.beraucoal.co.id/beats/api/mobile/login');

                    if ($reqLogin->failed()) return false;

                    $resLogin = json_decode($reqLogin, false);
                    if ($resLogin->id == null) return false;

                    return true;
                } else {
                    if (Hash::check($credentials['password'], $user->getAuthPassword())) {
                        return true;
                    }
                }
                return false;
            } catch (Exception $exception) {
                Log::error($exception->getMessage());
                return false;
            }

        }

        public function rehashPasswordIfRequired(Authenticatable $user, #[\SensitiveParameter] array $credentials, bool $force = false): void {
            if ($user->tipe_user != 1 && Hash::needsRehash($user->getAuthPassword())) {
                $user->password = Hash::make($credentials['password']);
                $user->save();
            }
        }
    }
