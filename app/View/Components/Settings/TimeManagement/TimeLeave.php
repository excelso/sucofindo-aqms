<?php

    namespace App\View\Components\Settings\TimeManagement;

    use App\Models\Payrolls\PayrollComponents;
    use App\Models\TimeManagement\TimeManagementLeave;
    use App\Models\TimeManagement\TimeManagementSchedule;
    use App\Models\TimeManagement\TimeManagementShift;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class TimeLeave extends Component {
        public Collection|null $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = TimeManagementLeave::where('company_id', session('company_selected_id'))->get();
            $this->class = $class != '' ? $class : 'timeLeaveId';
            $this->id = $id != '' ? $id : 'timeLeaveId';
            $this->name = $name != '' ? $name : 'timeLeaveId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.time-management.time-leave');
        }
    }
