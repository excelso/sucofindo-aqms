<?php

    namespace App\Http\Controllers\Settings;

    use App\Http\Controllers\Controller;
    use App\Http\Helper\ExportExcel;
    use App\Http\Helper\ExRoleAccess;
    use App\Models\Users\UserRole;
    use App\Models\Users\UserRoleMenu;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;

    class ControllerRoles extends Controller {
        protected string $viewPath;
        protected array $roleAccess;

        public function __construct() {
            $this->viewPath = 'main/settings/data-roles';
            $this->roleAccess = ExRoleAccess::roleAccess('designation');
        }

        public function index(Request $request): View {
            $userRole = UserRole::dataUserRole([
                'search' => $request->input()
            ])->paginate(20)->onEachSide(1);

            $totalTrash = UserRole::onlyTrashed()->count();

            return view($this->viewPath . '.index', [
                'items' => $userRole,
                'totalTrash' => $totalTrash,
                'roleAccess' => $this->roleAccess,
            ]);
        }

        //region Handle Store
        public function handleStore(Request $request) {
            DB::beginTransaction();
            try {

                $validator = Validator::make($request->all(), [
                    'role_name' => 'required',
                    'role_menu_permission' => 'required',
                ], [], [
                    'role_name' => 'Role Name',
                    'role_menu_permission' => 'Menu Permission',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                $userRole = UserRole::create([
                    'role_name' => $request->input('role_name'),
                    'role_menu_permission' => $request->input('role_menu_permission'),
                ]);

                foreach ($request->input('role_menus') as $item) {
                    UserRoleMenu::create([
                        'role_id' => $userRole->id,
                        'menu_id' => $item['menu_id'],
                        'features' => $item['features'] != null ? json_encode($item['features']) : null,
                        'role_status' => 1
                    ]);
                }

                DB::commit();
                return response()->json([
                    'message' => 'New data Role Menu has been saved Successfully',
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {

                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Detail
        public function handleDetailRole($roleId) {
            try {
                $userRole = UserRole::where('id', $roleId)->with(
                    [
                        'roleMenu' => function ($q) {
                            $q->where('role_status', '=', 1);
                        }
                    ]
                )->first();

                return response()->json([
                    'data' => $userRole,
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Update
        public function handleUpdate(Request $request, $roleId) {
            DB::beginTransaction();
            try {

                $validator = Validator::make($request->all(), [
                    'role_name' => 'required',
                    'role_menu_permission' => 'required',
                ], [], [
                    'role_name' => 'Role Name',
                    'role_menu_permission' => 'Menu Permission',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                UserRole::where('id', $roleId)->update([
                    'role_name' => $request->input('role_name'),
                    'role_menu_permission' => $request->input('role_menu_permission'),
                ]);

                foreach ($request->input('role_menus') as $item) {
                    UserRoleMenu::updateOrCreate([
                        'role_id' => $roleId,
                        'menu_id' => $item['menu_id']
                    ], [
                        'role_id' => $roleId,
                        'menu_id' => $item['menu_id'],
                        'features' => $item['features'] != null ? json_encode($item['features']) : null,
                        'role_status' => 1
                    ]);
                }

                $existingMenuIds = UserRoleMenu::where('role_id', $roleId)->pluck('menu_id')->toArray();
                $newMenuIds = collect($request->input('role_menus'))->pluck('menu_id')->toArray();

                // Set role_status to 0 for menus that are in the database but not in the request
                UserRoleMenu::where('role_id', $roleId)
                    ->whereIn('menu_id', array_diff($existingMenuIds, $newMenuIds))
                    ->update(['role_status' => 0]);

                // Set role_status to 1 for menus that are in the request but not in the database
                UserRoleMenu::where('role_id', $roleId)
                    ->whereIn('menu_id', array_diff($newMenuIds, $existingMenuIds))
                    ->update(['role_status' => 1]);

                DB::commit();
                return response()->json([
                    'message' => 'Change data Role Menu has been saved Successfully',
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Delete
        public function handleDelete($roleId) {
            DB::beginTransaction();
            try {

                $data = UserRole::where('id', $roleId)->first();
                if (in_array($data->init_master, [1, 2])) {
                    return response()->json([
                        'message' => 'This is a Master Role, you will not be able to delete it.',
                        'responseTime' => Carbon::now()
                    ], 400);
                }

                $data->delete();

                DB::commit();
                return response()->json([
                    'message' => 'Data Role Menu has been deleted',
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);

            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Trash
        public function trash() {
            try {
                $dataTrash = UserRole::onlyTrashed()->paginate(20);

                return response()->json([
                    'data' => $dataTrash,
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Restore Data from Trash
        public function restore($roleId) {
            DB::beginTransaction();
            try {

                UserRole::onlyTrashed()->where('id', $roleId)->restore();

                DB::commit();
                return response()->json([
                    'message' => 'Data Role has been Restored',
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {

                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Force Delete Data from Trash
        public function forceDelete($roleId) {
            DB::beginTransaction();
            try {

                UserRole::onlyTrashed()->where('id', $roleId)->forceDelete();

                DB::commit();
                return response()->json([
                    'message' => 'Data Role has been Deleted',
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {

                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Export Excel
        public function exportExcel(Request $request): void {
            $dataToEksport = UserRole::dataUserRole([
                'search' => $request->input(),
            ])->get();

            //region Init Data Excel
            $data_row = [];
            if (count($dataToEksport) != 0) {
                $i = 0;
                foreach ($dataToEksport as $item) {
                    $i++;

                    $data_row[] = [
                        $i,
                        $item->role_name ?? '',
                        $item->role_menu_permission == 1 ? 'All Access' : 'Custom Access Menu',
                        Carbon::parse($item->updated_at)->format('Y-m-d H:i:s') ?? '',
                    ];
                }
            }
            //endregion

            //region Init Kolom Header Excel
            $head = [
                'No' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 8,
                    ]
                ],
                'Role Name' => [
                    'props' => [
                        'align' => 'left',
                        'width' => 'auto',
                        'format' => '@text',
                    ]
                ],
                'Menu Permission' => [
                    'props' => [
                        'align' => 'left',
                        'width' => 'auto',
                        'format' => '@text',
                    ]
                ],
                'Updated Date' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 'auto',
                        'format' => '@datetime',
                    ]
                ],
            ];
            //endregion

            $exportExcel = new ExportExcel($head, $data_row, 'DataRoles');
            $exportExcel->exportExcel();
        }
        //endregion

    }
