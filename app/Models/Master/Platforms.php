<?php

    namespace App\Models\Master;

    use App\Models\Master\Geo\GeoProvince;
    use App\Models\Users\User;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Platforms extends Model {
        use SoftDeletes;

        protected $keyType = 'string';
        public $incrementing = false;
        protected $table = 't_platforms';
        protected $fillable = [
            'company_site_id',
            'uid',
            'cctv_link',
            'cctv_link_hls',
            'timezone',
        ];

        public function sites(): BelongsTo {
            return $this->belongsTo(CompaniesSites::class, 'company_site_id', 'id');
        }

        public function loggerLimit(): HasOne {
            return $this->hasOne(LoggersLimit::class, 'uid', 'uid');
        }

        public function scopeDataPlatforms(Builder $builder, $options = []): void {
            $builder->orderBy('created_at');
        }

        public function scopeDataPlatformsById(Builder $builder, $id): void {
            $builder->where('id', $id);
        }
    }
