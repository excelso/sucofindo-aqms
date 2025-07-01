<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
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

        public function sites(): Builder|HasMany|Companies {
            return $this->hasMany(CompaniesSites::class, 'company_id', 'id')
                ->orderBy('created_at', 'ASC');
        }

    }
