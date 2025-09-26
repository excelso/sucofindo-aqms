<?php

namespace App\Models\BeSparing\Master;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class PlatformDokumen extends Model {
    use HasFactory;

    protected $guarded = [];
    protected $table = 't_platform_dokumen';

}
