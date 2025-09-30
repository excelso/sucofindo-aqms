<?php

    namespace App\View\Components;

    use Closure;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Contracts\Support\Htmlable;
    use Illuminate\Contracts\View\Factory;
    use Illuminate\Contracts\View\View;
    use Illuminate\Support\Collection;
    use Illuminate\View\Component;

    class DataTahun extends Component {
        public mixed $periode;
        public string $class;
        public string $name;
        public string $selected;
        public string $disabled;

        public function __construct($class = '', $name = '', $selected = '', $disabled = '') {

            $tahun = [];
            for ($i = 2024; $i <= date('Y'); $i++) {
                $tahun[] = [
                    'periode' => $i
                ];
            }

            $this->periode = json_decode(json_encode($tahun));
            $this->class = $class != '' ? $class : 'tahun';
            $this->name = $name != '' ? $name : 'tahun';
            $this->selected = $selected;
            $this->disabled = $disabled !== '' ? 'disabled' : '';
        }

        public function render() : View|Factory|Htmlable|string|Closure|Application {
            return view('components.dropdown-tahun');
        }
    }
