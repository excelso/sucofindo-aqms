<?php

    namespace App\Http\Controllers\Master;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Companies;
    use App\Models\Master\CompaniesSites;
    use App\Models\Master\ExternalEmployee;
    use App\Models\Users\User;
    use App\Models\Users\UserPlatforms;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;
    use Illuminate\Validation\Rules\Password;
    use Illuminate\View\View;
    use Throwable;

    class ControllerUsers extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/master/data-users';
        }

        public function index(): View {

            $dataCompanies = Companies::all();
            $dataUsers = User::dataUsers();
            return view($this->viewPath . '/index', [
                'items' => $dataUsers->paginate(20)->onEachSide(1),
                'companies' => $dataCompanies,
            ]);
        }

        //region Handle Store
        public function store(Request $request) {
            $rules = [
                'nama_lengkap' => 'required',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('t_users')->where('email', $request->input('email'))->whereNull('deleted_at')
                ],
            ];

            if ($request->input('tipe_user') == '2') {
                $rules = array_merge($rules, [
                    'password' => [
                        Password::min(8)
                            ->mixedCase()
                    ],
                    're_password' => 'min:8|required_with:password|same:password',
                ]);
            } else {
                $rules = array_merge($rules, [
                    'sid_code' => 'required'
                ]);
            }

            $rules = array_merge($rules, [
                'role_id' => 'required'
            ]);

            $validator = Validator::make($request->all(), $rules, [], [
                'sid_code' => 'SID Code',
                'nama_lengkap' => 'Full Name',
                'email' => 'Email',
                'password' => 'Password',
                're_password' => 'Repeat Password',
                'role_id' => 'Role',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {

                if ($request->input('role_id') != 'super_admin') {
                    if (count($request->input('site_permission')) == 0) {
                        return response()->json([
                            'message' => 'No Monitoring Site configuration selected',
                            'responseTime' => now()
                        ], 400);
                    }
                }

                DB::transaction(function () use ($request) {
                    $user = User::create([
                        'tipe_user' => $request->input('tipe_user'),
                        'sid_code' => $request->input('sid_code'),
                        'nama_lengkap' => $request->input('nama_lengkap'),
                        'email' => $request->input('email'),
                        'password' => Hash::make($request->input('re_password')),
                        'user_level' => $request->input('role_id'),
                        'status_user' => $request->input('status_user'),
                    ]);

                    if ($request->input('role_id') != 'super_admin') {
                        foreach ($request->input('site_permission') as $item) {
                            UserPlatforms::create([
                                'user_id' => $user->id,
                                'platform_id' => $item['platform_id'],
                                'type_logger' => $item['type_logger'],
                                'is_active' => 1
                            ]);
                        }
                    }
                });

                return response()->json([
                    'message' => 'New User data saved successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Get User SSO
        public function getUserSSO(Request $request): JsonResponse {
            try {

                $validator = Validator::make($request->all(), [
                    'sid_code' => 'required'
                ], [], [
                    'sid_code' => 'SID Code',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }
                $dataUserSSO = ExternalEmployee::where('sid_code', $request->input('sid_code'))->first();
                return response()->json([
                    'message' => 'Data User SSO berhasil ditemukan',
                    'data' => $dataUserSSO,
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

        //region Handle Detail User
        public function handleDetailUser($userId) {
            try {

                $detailUser = User::dataUserById($userId)
                    ->with('userPlatforms:user_id,platform_id,type_logger,is_active')->first();

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $detailUser,
                    'responseTime' => Carbon::now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Update
        public function update(Request $request, $userId) {
            $rules = [
                'nama_lengkap' => 'required'
            ];

            if ($request->input('email') != '') {
                if ($request->input('email') != $request->input('email_old')) {
                    $rules = array_merge($rules, [
                        'email' => [
                            'required',
                            'email',
                            Rule::unique('t_users')->where('email', $request->input('email'))->whereNull('deleted_at')
                        ],
                    ]);
                }
            } else {
                $rules = array_merge($rules, [
                    'email' => [
                        'required',
                        'email',
                        Rule::unique('t_users')->where('email', $request->input('email'))->whereNull('deleted_at')
                    ],
                ]);
            }

            if ($request->input('tipe_user') == '2') {
                if (strlen($request->input('password')) != 0) {
                    $rules = array_merge($rules, [
                        'password' => [
                            Password::min(8)
                                ->mixedCase()
                        ],
                        're_password' => 'min:8|required_with:password|same:password',
                    ]);
                }
            } else {
                $rules = array_merge($rules, [
                    'sid_code' => 'required'
                ]);
            }

            $rules = array_merge($rules, [
                'role_id' => 'required'
            ]);

            $validator = Validator::make($request->all(), $rules, [], [
                'sid_code' => 'SID Code',
                'nama_lengkap' => 'Full Name',
                'email' => 'Email',
                'password' => 'Password',
                're_password' => 'Repeat Password',
                'role_id' => 'Role',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {

                if ($request->input('role_id') != 'super_admin') {
                    if (count($request->input('site_permission')) == 0) {
                        return response()->json([
                            'message' => 'No Monitoring Site configuration selected',
                            'responseTime' => now()
                        ], 400);
                    }
                }

                DB::transaction(function () use ($request, $userId) {
                    User::where('id', $userId)->update([
                        'tipe_user' => $request->input('tipe_user'),
                        'sid_code' => $request->input('sid_code'),
                        'nama_lengkap' => $request->input('nama_lengkap'),
                        'email' => $request->input('email'),
                        'user_level' => $request->input('role_id'),
                        'status_user' => $request->input('status_user'),
                    ]);

                    if (strlen($request->input('re_password')) != 0) {
                        (new User)->where('id', $userId)->update([
                            'password' => Hash::make($request->input('re_password')),
                        ]);
                    }

                    if ($request->input('role_id') != 'super_admin') {
                        $newPermissions = $request->input('site_permission', []);

                        // Get existing permissions untuk user ini
                        $existingPermissions = UserPlatforms::where('user_id', $userId)->get();

                        // Convert new permissions ke format yang mudah dicari
                        $newPermissionsMap = [];
                        foreach ($newPermissions as $permission) {
                            $key = $permission['platform_id'] . '_' . $permission['type_logger'];
                            $newPermissionsMap[$key] = $permission;
                        }

                        // STEP 1: Update existing permissions
                        foreach ($existingPermissions as $existing) {
                            $key = $existing->platform_id . '_' . $existing->type_logger;

                            if (isset($newPermissionsMap[$key])) {
                                // Permission masih dipilih - set is_active = 1
                                $existing->update([
                                    'is_active' => 1
                                ]);

                                // Remove dari map agar tidak diinsert lagi
                                unset($newPermissionsMap[$key]);
                            } else {
                                // Permission tidak dipilih - set is_active = 0
                                $existing->update([
                                    'is_active' => 0
                                ]);
                            }
                        }

                        // STEP 2: Insert permissions yang belum ada
                        foreach ($newPermissionsMap as $permission) {
                            UserPlatforms::create([
                                'user_id' => $userId,
                                'platform_id' => $permission['platform_id'],
                                'type_logger' => $permission['type_logger'],
                                'is_active' => 1
                            ]);
                        }
                    }
                });

                return response()->json([
                    'message' => 'Update User data saved successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Delete
        public function delete(Request $request, $userId) {
            try {

                DB::transaction(function () use ($request, $userId) {
                    User::where('id', $userId)->delete();
                });

                return response()->json([
                    'message' => 'User data deleted successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion
    }
