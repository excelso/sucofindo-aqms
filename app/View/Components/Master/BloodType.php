<?php

    namespace App\View\Components\Master;

    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class BloodType extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = \App\Models\Master\BloodType::all();
            $this->class = $class != '' ? $class : 'bloodTypeId';
            $this->id = $id != '' ? $id : 'bloodTypeId';
            $this->name = $name != '' ? $name : 'bloodTypeId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.master.blood-type');
        }
    }
