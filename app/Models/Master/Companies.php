<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Companies extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_companies';
        protected $fillable = [
            'company_name'
        ];
        protected $primaryKey = 'id';
    }
