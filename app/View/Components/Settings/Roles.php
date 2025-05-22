<?php

    namespace App\View\Components\Settings;

    use App\Models\Users\UserRole;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Roles extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = UserRole::dataUserRoleExBox()->get();
            $this->class = $class != '' ? $class : 'roleId';
            $this->id = $id != '' ? $id : 'roleId';
            $this->name = $name != '' ? $name : 'roleId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.roles');
        }
    }
