<?php

    namespace App\View\Components\Companies;

    use App\Models\Companies\Companies;
    use App\Models\Companies\CompaniesDepartment;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Company extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = Companies::dataCompanyExBox()->get();
            $this->class = $class != '' ? $class : 'employeeCompany';
            $this->id = $id != '' ? $id : 'employeeCompany';
            $this->name = $name != '' ? $name : 'employeeCompany';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.companies.company');
        }
    }
