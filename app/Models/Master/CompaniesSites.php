<?php

    namespace App\Models\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class CompaniesSites extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_companies_sites';
        protected $fillable = [
            'company_id',
            'site_name',
        ];
        protected $primaryKey = 'id';
        protected $hidden = ['deleted_at'];

        public function companies(): BelongsTo {
            return $this->belongsTo(Companies::class, 'company_id', 'id');
        }

        public function platforms(): HasMany {
            return $this->hasMany(Platforms::class, 'company_site_id', 'id')
                ->orderBy('created_at', 'ASC');
        }

        public function scopeDataSites(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->select('*');

            if (!empty($search['site_name'])) {
                $builder->where('site_name', 'like', '%' . $search['site_name'] . '%');
            }

            $builder->orderBy('created_at');
        }

        public function scopeDataSitesByCompanyId(Builder $builder, $companyId): void {
            $builder->select('*');
            $builder->where('company_id', $companyId);
            $builder->orderBy('created_at');
        }
    }
