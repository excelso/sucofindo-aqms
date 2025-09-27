<?php

    namespace App\Models\BeSparing\Karyawan;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Support\Facades\DB;

    class UserSite extends Model {

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_users_sites';

        public function userSitesTipeLogger(): HasMany {
            return $this->hasMany(UserSiteTipeLogger::class, 'users_sites_id', 'id');
        }

        public function scopeGetUsersAksesSitesPlatform(Builder $builder, $userId): void {
            $builder->select(
                't_platform.*',
                't_customer.nama_perusahaan',
                't_customer_site.nama_site',
                't_jenis_industri.parameter',
                't_jenis_industri.paramPh',
                't_jenis_industri.paramCod',
                't_jenis_industri.paramTss',
                't_jenis_industri.paramNh3n',
                't_jenis_industri.paramDebit',
                't_parameter.last_online',
                't_parameter_limit.ph_intermit',
                't_parameter_limit.cod_intermit',
                't_parameter_limit.tss_intermit',
                't_parameter_limit.nh3n_intermit',
                't_parameter_limit.debit_intermit',
                't_parameter_limit.ph_mutu_min as phMutuMin',
                't_parameter_limit.ph_mutu_max as phMutuMax',
                't_parameter_limit.ph_warn_min as phWarnMin',
                't_parameter_limit.ph_warn_max as phWarnMax',
                't_parameter_limit.cod_warn as codWarn',
                't_parameter_limit.cod_mutu as codMutu',
                't_parameter_limit.tss_warn as tssWarn',
                't_parameter_limit.tss_mutu as tssMutu',
                't_parameter_limit.nh3n_warn as nh3nWarn',
                't_parameter_limit.nh3n_mutu as nh3nMutu',
                't_parameter_limit.debit_warn as debitWarn',
                't_parameter_limit.debit_mutu as debitMutu',
                't_parameter_limit.debit_warn_konv as debitWarnKonv',
                't_parameter_limit.debit_mutu_konv as debitMutuKonv',
            );
            $builder->leftJoin('t_platform', 't_users_sites.site_id', '=', 't_platform.site_id');
            $builder->leftJoin('t_customer', 't_platform.customer_id', '=', 't_customer.id');
            $builder->leftJoin('t_customer_site', 't_platform.site_id', '=', 't_customer_site.id');
            $builder->leftJoin('t_jenis_industri', 't_customer.industri_id', '=', 't_jenis_industri.id');
            $builder->leftJoin('t_parameter_limit', 't_platform.uid', '=', 't_parameter_limit.uid');
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.uid,
                        MAX(t_parameter.datetime_unix) as last_online
                    FROM t_parameter
                    GROUP BY t_parameter.uid
                ) AS t_parameter
            '), 't_platform.uid', '=', 't_parameter.uid');
            $builder->where('t_users_sites.user_id', '=', $userId);
            $builder->where('t_users_sites.status_site', '=', 1);
            $builder->whereNotNull('t_parameter.uid');
            $builder->orderBy('t_parameter.last_online', 'DESC');
        }

    }
