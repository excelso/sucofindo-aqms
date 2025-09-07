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
            'company_site_location_id',
            'uid',
            'uid_alias',
            'cctv_link_1',
            'cctv_1_support_ptz',
            'cctv_link_2',
            'cctv_2_support_ptz',
            'cctv_link_hls',
            'timezone',
            'lat',
            'lng',
            'ssh_host',
            'ssh_username',
            'ssh_password',
            'ssh_port',
            'cctv_portal_ip',
            'cctv_portal_username',
            'cctv_portal_password',
            'is_trial',
            'is_active',
        ];

        public function sites(): BelongsTo {
            return $this->belongsTo(CompaniesSites::class, 'company_site_id', 'id');
        }

        public function sitesLocation(): BelongsTo {
            return $this->belongsTo(CompaniesSitesLocation::class, 'company_site_location_id', 'id');
        }

        public function loggerLimit(): HasOne {
            return $this->hasOne(LoggersLimit::class, 'uid', 'uid');
        }

        public function scopeDataPlatformByUserPlatform(Builder $builder, $platformId = null, $isTrial = null): void {
            if ($platformId) {
                if (is_array($platformId)) {
                    $builder->whereIn('id', $platformId);
                } else {
                    $builder->where('id', $platformId);
                }
            }

            $builder->where('is_trial', '=', $isTrial);
            $builder->orderBy('uid', 'ASC');
        }

        public function scopeDataPlatforms(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0) {
                $search = $options['search'];
            }

            if (!empty($search['site_id'])) {
                $builder->where('company_site_id', '=', $search['site_id']);
            }

            if (!empty($search['location_id'])) {
                $builder->where('company_site_location_id', '=', $search['location_id']);
            }

            if (!empty($search['uid'])) {
                $builder->where('uid', 'like', '%' . $search['uid'] . '%');
            }

            if (!empty($search['uid_alias'])) {
                $builder->where('uid_alias', 'like', '%' . $search['uid_alias'] . '%');
            }

            $builder->orderBy('uid', 'ASC');
        }

        public function scopeDataPlatformsById(Builder $builder, $id): void {
            $builder->where('id', $id);
        }
    }
