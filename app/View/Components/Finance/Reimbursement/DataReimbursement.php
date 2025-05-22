<?php

    namespace App\View\Components\Finance\Reimbursement;

    use App\Models\Finance\Reimbursement;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class DataReimbursement extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '') {
            $this->options = Reimbursement::dataReimbursementForDropdown()->get();
            $this->class = $class != '' ? $class : 'reimbursementId';
            $this->id = $id != '' ? $id : 'reimbursementId';
            $this->name = $name != '' ? $name : 'reimbursementId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.finance.reimbursement.data-reimbursement');
        }
    }
