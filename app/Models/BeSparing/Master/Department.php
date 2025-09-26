<?php

namespace App\Models\BeSparing\Master;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model {
    use HasFactory, SoftDeletes;

    protected $guarded = [];
    protected $table = 't_perusahaan_dept';

    public function perusahaan(): BelongsTo {
        return $this->belongsTo(Perusahaan::class, 'perusahaan_id', 'id');
    }

    public function scopeDataDepartment(Builder $builder, $options = []): void {
        $search = [];
        if (count($options) != 0)
            $search = $options['search'];

        if (request()->user()->role_id == 2) {
            // Jika sebagai Admin
            $builder->where('perusahaan_id', request()->user()->perusahaan_id);
        }

        if (isset($search['nama-dept']) && $search['nama-dept'] != '') {
            $builder->where('nama_dept', 'LIKE', '%' . $search['nama-dept'] . '%');
        }

        if (isset($search['alias-dept']) && $search['alias-dept'] != '') {
            $builder->where('alias_dept', 'LIKE', '%' . $search['alias-dept'] . '%');
        }

        if (isset($search['perusahaan']) && $search['perusahaan'] != '') {
            $builder->where('perusahaan_id', $search['perusahaan']);
        }
    }

    public function scopeDataDepartmentByPerusahaanId(Builder $builder, $perusahaan_id): void {
        $builder->where('perusahaan_id', $perusahaan_id);
    }

}
