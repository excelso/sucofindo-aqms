<?php

    namespace App\Models\Master;

    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Support\Facades\DB;

    class ExternalCompany extends Model {
        use Compoships, SoftDeletes;

        protected $guarded = [];
        protected $table = 't_external_company';
    }
