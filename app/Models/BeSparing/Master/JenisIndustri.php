<?php

    namespace App\Models\BeSparing\Master;

    use Awobaz\Compoships\Compoships;
    use Illuminate\Database\Eloquent\Model;

    class JenisIndustri extends Model {
        use Compoships;

        protected $guarded = [];
        protected $table = 't_jenis_industri';

    }
