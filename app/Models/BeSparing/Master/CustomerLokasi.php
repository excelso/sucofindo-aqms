<?php

    namespace App\Models\BeSparing\Master;

    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Awobaz\Compoships\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class CustomerLokasi extends Model {
        use Compoships, SoftDeletes;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_customer_lokasi';

        public function customer(): BelongsTo {
            return $this->belongsTo(Customer::class, 'customer_id', 'id');
        }

        public function scopeCustomerLokasi(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0)
                $search = $options['search'];

            $builder->select('*');

            if (isset($search['customer_id']) && $search['customer_id'] != '') {
                $builder->where('t_customer_lokasi.customer_id', '=', $search['customer_id']);
            }

            if (isset($search['nama_lokasi']) && $search['nama_lokasi'] != '') {
                $builder->where('t_customer_lokasi.nama_lokasi', 'LIKE', '%' . $search['nama_lokasi'] . '%');
            }
        }

    }
