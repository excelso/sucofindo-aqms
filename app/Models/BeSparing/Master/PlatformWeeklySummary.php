<?php

    namespace App\Models\BeSparing\Master;

    use Auth;
    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo as RelationsBelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Support\Facades\DB;

    class PlatformWeeklySummary extends Model {
        use Compoships, SoftDeletes;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_platform_weekly_summary';

    }
