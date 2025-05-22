<?php

    namespace App\View\Components\Master;

    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class SkillCategories extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = \App\Models\Master\SkillCategories::all();
            $this->class = $class != '' ? $class : 'skillCategoryId';
            $this->id = $id != '' ? $id : 'skillCategoryId';
            $this->name = $name != '' ? $name : 'skillCategoryId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.master.skill-categories');
        }
    }
