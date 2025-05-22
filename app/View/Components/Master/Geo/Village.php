<?php

    namespace App\View\Components\Master\Geo;

    use App\Models\Master\Geo\GeoProvince;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Village extends Component {
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->class = $class != '' ? $class : 'villageId';
            $this->id = $id != '' ? $id : 'villageId';
            $this->name = $name != '' ? $name : 'villageId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.master.geo.village');
        }
    }
