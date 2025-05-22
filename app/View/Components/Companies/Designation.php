<?php

    namespace App\View\Components\Companies;

    use App\Models\Master\Geo\GeoProvince;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Designation extends Component {
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->class = $class != '' ? $class : 'employeeDesignation';
            $this->id = $id != '' ? $id : 'employeeDesignation';
            $this->name = $name != '' ? $name : 'employeeDesignation';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.companies.designation');
        }
    }
