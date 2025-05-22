<?php

    namespace App\View\Components\Companies;

    use App\Models\Companies\CompaniesEmployeeType;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class EmployeeType extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = CompaniesEmployeeType::all();
            $this->class = $class != '' ? $class : 'employeeType';
            $this->id = $id != '' ? $id : 'employeeType';
            $this->name = $name != '' ? $name : 'employeeType';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.companies.employee-type');
        }
    }
