<?php

    namespace App\Models\BeAqms\Master;

    use Awobaz\Compoships\Compoships;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class ExternalEmployee extends Model {
        use Compoships, SoftDeletes;

        protected $connection = 'aqms-mysql';
        protected $guarded = [];
        protected $table = 't_external_employee';
    }
