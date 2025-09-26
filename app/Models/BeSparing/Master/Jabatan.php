<?php

    namespace App\Models\BeSparing\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Relations\HasOne;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\DB;

    class Jabatan extends Model {
        use HasFactory, SoftDeletes;

        protected $guarded = [];
        protected $table = 't_perusahaan_jabatan';

        public function perusahaan(): BelongsTo {
            return $this->belongsTo(Perusahaan::class, 'perusahaan_id', 'id');
        }

        public function department(): BelongsTo {
            return $this->belongsTo(Department::class, 'perusahaan_dept_id', 'id');
        }

        public function scopeDataJabatan(Builder $builder, $options = []): void {
            $search = [];
            if (count($options) != 0)
                $search = $options['search'];

            if (request()->user()->role_id == 2) {
                // Jika sebagai Admin
                $builder->where('perusahaan_id', request()->user()->perusahaan_id);
            }

            if (isset($search['nama-jabatan']) && $search['nama-jabatan'] != '') {
                $builder->where('nama_jabatan', 'LIKE', '%' . $search['nama-jabatan'] . '%');
            }

            if (isset($search['perusahaan']) && $search['perusahaan'] != '') {
                $builder->where('perusahaan_id', $search['perusahaan']);
            }

            if (isset($search['dept']) && $search['dept'] != '') {
                $builder->where('perusahaan_dept_id', $search['dept']);
            }
        }

        public function scopeDataJabatanByPeruIdDeptId(Builder $builder, $perusahaan_id, $department_id): void {
            $builder->where('perusahaan_id', $perusahaan_id);
            $builder->where('perusahaan_dept_id', $department_id);
        }

    }
