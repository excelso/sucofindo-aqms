<?php

    namespace App\View\Components\Settings\TimeManagement;

    use App\Models\Payrolls\PayrollComponents;
    use App\Models\TimeManagement\TimeManagementShift;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class TimeShift extends Component {
        public Collection|null $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = TimeManagementShift::dataShift()->get();
            $this->class = $class != '' ? $class : 'timeShiftId';
            $this->id = $id != '' ? $id : 'timeShiftId';
            $this->name = $name != '' ? $name : 'timeShiftId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.time-management.time-shift');
        }
    }
