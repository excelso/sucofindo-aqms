<?php

    namespace App\Models\BeSparing\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\DB;

    class Perusahaan extends Model {
        use HasFactory;

        protected $guarded = [];
        protected $table = 't_perusahaan';

        public function scopeDataPerusahaan(Builder $builder, $options = []): void {
            if (request()->user()->role_id == 2) {
                // Jika sebagai Admin
                $builder->where('id', request()->user()->perusahaan_id);
            }
        }

    }
