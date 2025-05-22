<?php

    namespace App\View\Components\Settings\TimeManagement;

    use App\Models\Payrolls\PayrollComponents;
    use App\Models\TimeManagement\TimeManagementLeave;
    use App\Models\TimeManagement\TimeManagementSchedule;
    use App\Models\TimeManagement\TimeManagementShift;
    use Closure;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\View\Component;
    use Illuminate\View\View;

    class TimeLeaveContract extends Component {
        public Collection|null $options;
        public string $class;
        public string $id;
        public string $name;
        public string $disabled;
        public string $selected;

        public function __construct($class = '', $id = '', $name = '', $disabled = '', $selected = '', $employeeCompanyId = '', $employeeTypeId = null) {
            $this->options = TimeManagementLeave::where('company_id', $employeeCompanyId)
                ->where('is_type_limit_balance', '=', 1)
                ->whereIn('type_balance_allocation', [1, 2])
                ->where(function (Builder $query) use ($employeeTypeId) {
                    $query->where('type_assigned_employee', '=', 1);

                    if ($employeeTypeId != 1) {
                        $query->orWhere(function (Builder $subQuery) use ($employeeTypeId) {
                            $subQuery->where('type_assigned_employee', '=', 3)
                                ->where('employee_type_id', '=', $employeeTypeId);
                        });
                    } else {
                        $query->orWhere(function (Builder $subQuery) use ($employeeTypeId) {
                            $subQuery->where('employee_type_id', '=', $employeeTypeId);
                        });
                    }
                })->get();

            $this->class = $class != '' ? $class : 'timeLeaveId';
            $this->id = $id != '' ? $id : 'timeLeaveId';
            $this->name = $name != '' ? $name : 'timeLeaveId';
            $this->disabled = $disabled != '' ? $disabled : '';
            $this->selected = $selected;
        }

        public function render(): View|Closure|string {
            return view('components.settings.time-management.time-leave');
        }
    }
