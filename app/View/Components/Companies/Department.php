<?php

    namespace App\View\Components\Companies;

    use Closure;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Department extends Component {
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->class = $class != '' ? $class : 'employeeDepartment';
            $this->id = $id != '' ? $id : 'employeeDepartment';
            $this->name = $name != '' ? $name : 'employeeDepartment';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.companies.department');
        }
    }
