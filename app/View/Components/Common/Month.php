<?php

    namespace App\View\Components\Common;

    use Carbon\Carbon;
    use Closure;
    use Illuminate\Contracts\View\View;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;

    class Month extends Component {
        public array $options;

        /**
         * Create a new component instance.
         */
        public function __construct(
            public string          $class = 'month',
            public string          $id = 'month',
            public string          $name = 'month',
            public string          $disabled = '',
            public string|int|null $selected = null,
            public string          $format = 'MMMM', // format default untuk nama bulan lengkap
            public string          $locale = 'en'    // default locale Indonesia
        ) {
            Carbon::setLocale($this->locale);
            $this->options = $this->getMonths($format);
        }

        /**
         * Get array of months based on format
         */
        private function getMonths(string $format): array {
            $months = [];
            for ($i = 1; $i <= 12; $i++) {
                $months[] = [
                    'id' => $i,
                    'label_short' => Carbon::create(null, $i, 1)->isoFormat('MMM'),
                    'label' => Carbon::create(null, $i, 1)->isoFormat($format),
                ];
            }
            return $months;
        }

        /**
         * Get the view / contents that represent the component.
         */
        public function render(): View|Closure|string {
            return view('components.common.month');
        }
    }
