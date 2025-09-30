<?php

    namespace App\View\Components;

    use Closure;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Contracts\Support\Htmlable;
    use Illuminate\Contracts\View\Factory;
    use Illuminate\Contracts\View\View;
    use Illuminate\View\Component;

    class DataBulan extends Component {
        public array $dataBulan;
        public string $class;
        public string $name;
        public string $selected;
        public string $disabled;

        public function __construct($class = '', $name = '', $selected = '', $disabled = '') {
            $this->dataBulan = [
                1 => 'Januari',
                2 => 'Februari',
                3 => 'Maret',
                4 => 'April',
                5 => 'Mei',
                6 => 'Juni',
                7 => 'Juli',
                8 => 'Agustus',
                9 => 'September',
                10 => 'Oktober',
                11 => 'November',
                12 => 'Desember',
            ];
            $this->class = $class != '' ? $class : 'bulan';
            $this->name = $name != '' ? $name : 'bulan';
            $this->selected = $selected;
            $this->disabled = $disabled !== '' ? 'disabled' : '';
        }

        public function render() : View|Factory|Htmlable|string|Closure|Application {
            return view('components.dropdown-bulan');
        }
    }
