<?php

    namespace App\View\Components\Common;

    use App\Models\Employee\EmployeeAttendance;
    use Carbon\Carbon;
    use Closure;
    use Illuminate\Contracts\View\View;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;

    class YearByAttendance extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = EmployeeAttendance::yearByAttendance()->get();
            $this->class = $class != '' ? $class : 'employeeId';
            $this->id = $id != '' ? $id : 'employeeId';
            $this->name = $name != '' ? $name : 'employeeId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.common.year-by-attendance');
        }
    }
