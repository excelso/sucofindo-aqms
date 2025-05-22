<?php

    namespace App\View\Components\Employee;

    use App\Models\Users\UserRole;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class EmployeeByCompany extends Component {
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->class = $class != '' ? $class : 'employeeId';
            $this->id = $id != '' ? $id : 'employeeId';
            $this->name = $name != '' ? $name : 'employeeId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.employee.employee-by-company');
        }
    }
