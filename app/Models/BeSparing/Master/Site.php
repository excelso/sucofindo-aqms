<?php

    namespace App\Models\BeSparing\Master;

    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Support\Facades\DB;

    class Site extends Model {
        use Compoships, SoftDeletes;

        protected $guarded = [];
        protected $table = 't_customer_site';

        public function customer(): BelongsTo {
            return $this->belongsTo(Customer::class, 'customer_id', 'id');
        }

        public function customerLokasi(): BelongsTo {
            return $this->belongsTo(CustomerLokasi::class, 'customer_lokasi_id', 'id');
        }

        public function scopeSite(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0)
                $search = $options['search'];

            $builder->select('*');

            if (isset($search['customer_id']) && $search['customer_id'] != '') {
                $builder->where('t_customer_site.customer_id', '=', $search['customer_id']);
            }

            if (isset($search['customer_lokasi_id']) && $search['customer_lokasi_id'] != '') {
                $builder->where('t_customer_site.customer_lokasi_id', '=', $search['customer_lokasi_id']);
            }

            if (isset($search['nama_site']) && $search['nama_site'] != '') {
                $builder->where('t_customer_site.nama_site', 'LIKE', '%' . $search['nama_site'] . '%');
            }
        }

    }
