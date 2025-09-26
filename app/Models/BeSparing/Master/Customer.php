<?php

    namespace App\Models\BeSparing\Master;

    use App\Models\Master\Geo\Desa;
    use App\Models\Master\Geo\Kabupaten;
    use App\Models\Master\Geo\Kecamatan;
    use App\Models\Master\Geo\Provinsi;
    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Awobaz\Compoships\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Customer extends Model {
        use Compoships, SoftDeletes;

        protected $guarded = [];
        protected $table = 't_customer';

        public function site(): HasMany {
            return $this->hasMany(Site::class, 'customer_id', 'id');
        }

        public function jenisIndustri(): BelongsTo {
            return $this->belongsTo(JenisIndustri::class, 'industri_id', 'id');
        }

        public function provinsi(): BelongsTo {
            return $this->belongsTo(Provinsi::class, 'provinsi_id', 'id');
        }

        public function kabupaten(): BelongsTo {
            return $this->belongsTo(Kabupaten::class, 'kabupaten_id', 'id');
        }

        public function kecamatan(): BelongsTo {
            return $this->belongsTo(Kecamatan::class, 'kecamatan_id', 'id');
        }

        public function desa(): BelongsTo {
            return $this->belongsTo(Desa::class, 'kelurahan_id', 'id');
        }

        public function scopeCustomer(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0)
                $search = $options['search'];

            $builder->select('*');

            if (isset($search['nama_perusahaan']) && $search['nama_perusahaan'] != '') {
                $builder->where('t_customer.nama_perusahaan', 'LIKE', '%' . $search['nama_perusahaan'] . '%');
            }

            if (isset($search['email']) && $search['email'] != '') {
                $builder->where('t_customer.email', 'LIKE', '%' . $search['email'] . '%');
            }

            if (isset($search['no_telpon']) && $search['no_telpon'] != '') {
                $builder->where('t_customer.no_telpon', 'LIKE', '%' . $search['no_telpon'] . '%');
            }

            if (isset($search['jenis_industri']) && $search['jenis_industri'] != '') {
                $builder->where('t_customer.industri_id', '=', $search['jenis_industri']);
            }

            if (isset($search['pro']) && $search['pro'] != '') {
                $builder->where('t_customer.provinsi_id', '=', $search['pro']);
            }

            if (isset($search['kab']) && $search['kab'] != '') {
                $builder->where('t_customer.kabupaten_id', '=', $search['kab']);
            }

            if (isset($search['kec']) && $search['kec'] != '') {
                $builder->where('t_customer.kecamatan_id', '=', $search['kec']);
            }

            if (isset($search['des']) && $search['des'] != '') {
                $builder->where('t_customer.kelurahan_id', '=', $search['des']);
            }

            if (isset($search['alamat']) && $search['alamat'] != '') {
                $builder->where('t_customer.alamat', 'LIKE', '%' . $search['alamat'] . '%');
            }

        }

    }
