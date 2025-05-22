<?php

    namespace App\View\Components\Master\Geo;

    use App\Models\Master\Geo\GeoProvince;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Province extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = GeoProvince::all();
            $this->class = $class != '' ? $class : 'provinceId';
            $this->id = $id != '' ? $id : 'provinceId';
            $this->name = $name != '' ? $name : 'provinceId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.master.geo.province');
        }
    }
