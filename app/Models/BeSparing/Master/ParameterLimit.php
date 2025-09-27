<?php

    namespace App\Models\BeSparing\Master;

    use Awobaz\Compoships\Compoships;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Support\Facades\DB;

    class ParameterLimit extends Model {
        use Compoships;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_parameter_limit';

    }
