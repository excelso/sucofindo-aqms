<?php

    namespace App\Models\BeSparing\Karyawan;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Support\Facades\DB;

    class UserSiteTipeLogger extends Model {

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_users_sites_tipe_logger';

    }
