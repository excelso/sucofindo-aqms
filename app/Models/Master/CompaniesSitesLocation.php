<?php

    namespace App\Models\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class CompaniesSitesLocation extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_companies_sites_location';
        protected $fillable = [
            'company_site_id',
            'location_name',
        ];
        protected $primaryKey = 'id';
        protected $hidden = ['deleted_at'];

        public function sites(): BelongsTo {
            return $this->belongsTo(CompaniesSites::class, 'company_site_id', 'id');
        }

        public function platforms(): HasMany {
            return $this->hasMany(Platforms::class, 'company_site_id', 'id')
                ->orderBy('created_at', 'ASC');
        }

        public function scopeDataSitesLocation(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            $builder->select('*');

            if (!empty($search['site_id'])) {
                $builder->where('company_site_id', '=', $search['site_id']);
            }

            if (!empty($search['location_name'])) {
                $builder->where('location_name', 'like', '%' . $search['location_name'] . '%');
            }

            $builder->orderBy('created_at');
        }

        public function scopeDataSitesLocationBySiteId(Builder $builder, $siteId): void {
            $builder->select('*');
            $builder->where('company_site_id', $siteId);
            $builder->orderBy('created_at');
        }
    }
