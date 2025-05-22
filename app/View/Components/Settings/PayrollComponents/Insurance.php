<?php

    namespace App\View\Components\Settings\PayrollComponents;

    use App\Models\Payrolls\PayrollComponents;
    use App\Models\Payrolls\PayrollInsurance;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Insurance extends Component {
        public Collection|null $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '', $employeeCompanyId = '') {
            $this->options = $employeeCompanyId != '' ? PayrollInsurance::dataPayrollInsuranceExBox($employeeCompanyId)->get() : null;
            $this->class = $class != '' ? $class : 'payrollInsuranceId';
            $this->id = $id != '' ? $id : 'payrollInsuranceId';
            $this->name = $name != '' ? $name : 'payrollInsuranceId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.payroll-components.insurance');
        }
    }
