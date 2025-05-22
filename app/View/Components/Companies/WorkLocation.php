<?php

    namespace App\View\Components\Companies;

    use App\Models\Companies\CompaniesWorkLocation;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class WorkLocation extends Component {
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->class = $class != '' ? $class : 'employeeWorkLocation';
            $this->id = $id != '' ? $id : 'employeeWorkLocation';
            $this->name = $name != '' ? $name : 'employeeWorkLocation';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.companies.work-location');
        }
    }
