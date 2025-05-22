<?php

    namespace App\View\Components\Master;

    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Assets extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '', $employeeCompanyId = '') {
            $this->options = $employeeCompanyId != '' ? \App\Models\Master\Assets::dataAssetsForDropdown($employeeCompanyId)->get() : \App\Models\Master\Assets::dataAssetsForDropdown(1)->get();
            $this->class = $class != '' ? $class : 'assetId';
            $this->id = $id != '' ? $id : 'assetId';
            $this->name = $name != '' ? $name : 'assetId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.master.assets');
        }
    }
