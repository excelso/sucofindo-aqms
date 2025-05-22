<?php

    namespace App\View\Components\Settings\PayrollComponents;

    use App\Models\Payrolls\PayrollComponents;
    use Closure;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class Deduction extends Component {
        public Collection|null $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '', $employeeCompanyId = '') {
            $this->options = $employeeCompanyId != '' ? PayrollComponents::dataPayrollComponentExBox($employeeCompanyId, 'deduction')->get() : null;
            $this->class = $class != '' ? $class : 'payrollDeductionId';
            $this->id = $id != '' ? $id : 'payrollDeductionId';
            $this->name = $name != '' ? $name : 'payrollDeductionId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.payroll-components.components');
        }
    }
