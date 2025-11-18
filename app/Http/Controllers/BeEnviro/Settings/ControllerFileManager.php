<?php

    namespace App\Http\Controllers\BeEnviro\Settings;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeEnviro\DiskInfo;
    use App\Models\Users\User;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rules\Password;
    use Illuminate\View\View;

    class ControllerFileManager extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-enviro/settings/file-manager';
        }

        public function index(): View {

            $diskInfo = DiskInfo::where('disk_free', '!=', 0)->get();
            $dataFile = Loggers::whereNotNull('link_video_recorded')
                ->orderBy('created_at')->paginate(20)->onEachSide(1);

            return view($this->viewPath . '.index', [
                'diskInfo' => $diskInfo,
                'items' => $dataFile,
            ]);
        }

    }
