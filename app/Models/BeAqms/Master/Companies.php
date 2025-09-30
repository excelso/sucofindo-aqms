<?php

    namespace App\Models\BeAqms\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Companies extends Model {
        use SoftDeletes;

        protected $connection = 'aqms-mysql';
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
