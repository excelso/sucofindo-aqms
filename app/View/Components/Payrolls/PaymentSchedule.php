<?php

    namespace App\View\Components\Payrolls;

    use App\Models\Payrolls\PayrollPaymentSchedule;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class PaymentSchedule extends Component {
        public Collection $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;
        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '', $employeeCompanyId = '') {
            $this->options = $employeeCompanyId != '' ? PayrollPaymentSchedule::dataPaymentScheduleForDropdown($employeeCompanyId)->get() : PayrollPaymentSchedule::dataPaymentScheduleForDropdown(session('company_selected_id'))->get();
            $this->class = $class != '' ? $class : 'paymentScheduleId';
            $this->id = $id != '' ? $id : 'paymentScheduleId';
            $this->name = $name != '' ? $name : 'paymentScheduleId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View {
            return view('components.payrolls.payment-schedule');
        }
    }
