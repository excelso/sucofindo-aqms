<?php

    namespace App\Models\BeSparing\Master;

    use Awobaz\Compoships\Compoships;
    use Awobaz\Compoships\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Support\Facades\DB;

    class Parameter extends Model {
        use Compoships;

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_parameter';

        public function platform(): BelongsTo {
            return $this->belongsTo(Platform::class, ['uid', 'tipe_logger'], ['uid', 'tipe_logger']);
        }

        //region Handle Data Chart
        public function scopeDataCharts(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone, $sort = 'ASC'): void {
            $builder->select([
                't_parameter.id',
                't_parameter.temp',
                't_parameter.ph',
                't_parameter.debit',
                't_parameter.cod',
                't_parameter.tss',
                't_parameter.nh3n',
                't_parameter.datetime_unix',
                DB::raw('YEAR(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as tahun'),
                DB::raw('MONTH(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as bulan'),
                DB::raw('DAY(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as hari'),
                DB::raw('HOUR(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as jam'),
                DB::raw('MINUTE(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as menit'),
                DB::raw('SECOND(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")) as detik'),
                DB::raw('DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '"), "%H:%i") as waktu'),
                DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") as date_formatted'),
                DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '") as datetime'),
            ]);

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
            $builder->groupBy([DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")')]);
            $builder->orderBy('date_formatted', $sort);
            $builder->orderBy('waktu', $sort);
        }
        //endregion

        //region Handle Data Persentase
        public function scopeDataPersentase(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone): void {
            $builder->select(
                DB::raw('COUNT(tHelpTotal.tPId) AS total_data'),
                DB::raw('COUNT(tPhMutu.ph) AS ph_mutu'),
                DB::raw('COUNT(tPhNormal.ph) AS ph_normal'),
                DB::raw('COUNT(tPhWarning.ph) AS ph_warning'),
                DB::raw('COUNT(tPhDanger.ph) AS ph_danger'),
                DB::raw('COUNT(tCodMutu.cod) AS cod_mutu'),
                DB::raw('COUNT(tCodNormal.cod) AS cod_normal'),
                DB::raw('COUNT(tCodWarning.cod) AS cod_warning'),
                DB::raw('COUNT(tCodDanger.cod) AS cod_danger'),
                DB::raw('COUNT(tTssMutu.tss) AS tss_mutu'),
                DB::raw('COUNT(tTssNormal.tss) AS tss_normal'),
                DB::raw('COUNT(tTssWarning.tss) AS tss_warning'),
                DB::raw('COUNT(tTssDanger.tss) AS tss_danger'),
                DB::raw('COUNT(tNh3nMutu.nh3n) AS nh3n_mutu'),
                DB::raw('COUNT(tNh3nNormal.nh3n) AS nh3n_normal'),
                DB::raw('COUNT(tNh3nWarning.nh3n) AS nh3n_warning'),
                DB::raw('COUNT(tNh3nDanger.nh3n) AS nh3n_danger'),
                DB::raw('COUNT(tDebitMutu.debit) AS debit_mutu'),
                DB::raw('COUNT(tDebitNormal.debit) AS debit_normal'),
                DB::raw('COUNT(tDebitWarning.debit) AS debit_warning'),
                DB::raw('COUNT(tDebitDanger.debit) AS debit_danger'),
            );

            //region Handle Join Total Data
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tHelpTotal
            '), 't_parameter.id', '=', 'tHelpTotal.tPId');
            //endregion

            //region Handle Join pH Mutu
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.ph
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.ph < t_parameter_limit.ph_mutu_min AND t_parameter_limit.ph_intermit = 1) OR
                       t_parameter.ph <= t_parameter_limit.ph_mutu_max)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tPhMutu
        '), 't_parameter.id', '=', 'tPhMutu.tPId');
            //endregion

            //region Handle Join pH Normal
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.ph
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.ph <= 0 AND t_parameter_limit.ph_intermit = 1) OR
                       (t_parameter.ph > t_parameter_limit.ph_warn_min AND t_parameter.ph > t_parameter_limit.ph_warn_max))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tPhNormal
        '), 't_parameter.id', '=', 'tPhNormal.tPId');
            //endregion

            //region Handle Join pH Warning
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.ph
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.ph > t_parameter_limit.ph_mutu_min AND t_parameter.ph <= t_parameter_limit.ph_warn_min) OR
                       (t_parameter.ph >= t_parameter_limit.ph_warn_max AND t_parameter.ph < t_parameter_limit.ph_mutu_max))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tPhWarning
        '), 't_parameter.id', '=', 'tPhWarning.tPId');
            //endregion

            //region Handle Join pH Danger
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.ph
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.ph >= t_parameter_limit.ph_mutu_max OR
                      (t_parameter.ph <= t_parameter_limit.ph_mutu_min AND t_parameter_limit.ph_intermit = 0))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tPhDanger
        '), 't_parameter.id', '=', 'tPhDanger.tPId');
            //endregion

            //region Handle Join COD Mutu
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.cod
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.cod < t_parameter_limit.cod_mutu AND t_parameter_limit.cod_intermit = 1) OR t_parameter.cod <= t_parameter_limit.cod_mutu)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tCodMutu
        '), 't_parameter.id', '=', 'tCodMutu.tPId');
            //endregion

            //region Handle Join COD Normal
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.cod
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.cod <= 0 AND t_parameter_limit.cod_intermit = 1) OR t_parameter.cod < t_parameter_limit.cod_warn)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tCodNormal
        '), 't_parameter.id', '=', 'tCodNormal.tPId');
            //endregion

            //region Handle Join COD Warning
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.cod
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.cod BETWEEN t_parameter_limit.cod_warn AND t_parameter_limit.cod_mutu)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tCodWarning
        '), 't_parameter.id', '=', 'tCodWarning.tPId');
            //endregion

            //region Handle Join COD Danger
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.cod
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.cod > t_parameter_limit.cod_mutu OR (t_parameter.cod <= 0 AND t_parameter_limit.cod_intermit = 0))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tCodDanger
        '), 't_parameter.id', '=', 'tCodDanger.tPId');
            //endregion

            //region Handle Join TSS Mutu
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.tss
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.tss < t_parameter_limit.tss_mutu AND t_parameter_limit.tss_intermit = 1) OR t_parameter.tss <= t_parameter_limit.tss_mutu)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tTssMutu
        '), 't_parameter.id', '=', 'tTssMutu.tPId');
            //endregion

            //region Handle Join TSS Normal
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.tss
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.tss <= 0 AND t_parameter_limit.tss_intermit = 1) OR (t_parameter.tss > tss_warn_min AND t_parameter.tss < tss_mutu_min))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tTssNormal
            '), 't_parameter.id', '=', 'tTssNormal.tPId');
            //endregion

            //region Handle Join TSS Warning
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.tss
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.tss > tss_warn AND tss <= tss_warn_min) OR (t_parameter.tss >= tss_mutu_min AND tss < tss_mutu))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tTssWarning
        '), 't_parameter.id', '=', 'tTssWarning.tPId');
            //endregion

            //region Handle Join TSS Danger
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.tss
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.tss >= t_parameter_limit.tss_mutu OR (t_parameter.tss <= tss_warn AND t_parameter_limit.tss_intermit = 0))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tTssDanger
        '), 't_parameter.id', '=', 'tTssDanger.tPId');
            //endregion

            //region Handle Join NH3N Mutu
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.nh3n
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.nh3n < t_parameter_limit.nh3n_mutu AND t_parameter_limit.nh3n_intermit = 1) OR t_parameter.nh3n <= t_parameter_limit.nh3n_mutu)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tNh3nMutu
        '), 't_parameter.id', '=', 'tNh3nMutu.tPId');
            //endregion

            //region Handle Join NH3N Normal
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.nh3n
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.nh3n <= 0 AND t_parameter_limit.nh3n_intermit = 1) OR t_parameter.nh3n < t_parameter_limit.nh3n_warn)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tNh3nNormal
        '), 't_parameter.id', '=', 'tNh3nNormal.tPId');
            //endregion

            //region Handle Join NH3N Warning
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.nh3n
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.nh3n BETWEEN t_parameter_limit.nh3n_warn AND t_parameter_limit.nh3n_mutu)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tNh3nWarning
        '), 't_parameter.id', '=', 'tNh3nWarning.tPId');
            //endregion

            //region Handle Join NH3N Danger
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.nh3n
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND (t_parameter.nh3n > t_parameter_limit.nh3n_mutu OR (t_parameter.nh3n <= 0 AND t_parameter_limit.nh3n_intermit = 0))
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tNh3nDanger
        '), 't_parameter.id', '=', 'tNh3nDanger.tPId');
            //endregion

            //region Handle Join Debit Mutu
            if ($platformUid == 'BC-KLHK-TEST' || $platformUid == 'BC-SCIFI-TEST') {
                $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit < t_parameter_limit.debit_mutu AND t_parameter_limit.debit_intermit = 1) OR t_parameter.debit < t_parameter_limit.debit_mutu)
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitMutu
            '), 't_parameter.id', '=', 'tDebitMutu.tPId');
            } else {
                $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit < (t_parameter_limit.debit_mutu/24/60) AND t_parameter_limit.debit_intermit = 1) OR t_parameter.debit <= (t_parameter_limit.debit_mutu/24/60))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitMutu
            '), 't_parameter.id', '=', 'tDebitMutu.tPId');
            }
            //endregion

            //region Handle Join Debit Normal
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit <= 0 AND t_parameter_limit.debit_intermit = 1) OR t_parameter.debit > debit_warn_min AND t_parameter.debit < debit_mutu_min)
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitNormal
            '), 't_parameter.id', '=', 'tDebitNormal.tPId');
            //endregion

            //region Handle Join Debit Warning
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit >= debit_warn AND t_parameter.debit <= debit_warn_min) OR (t_parameter.debit >= debit_mutu_min AND t_parameter.debit < debit_mutu))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitWarning
            '), 't_parameter.id', '=', 'tDebitWarning.tPId');
            //endregion

            //region Handle Join Debit Danger
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND (t_parameter.debit >= t_parameter_limit.debit_mutu OR (t_parameter.debit <= t_parameter_limit.debit_warn AND t_parameter_limit.debit_intermit = 0))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitDanger
            '), 't_parameter.id', '=', 'tDebitDanger.tPId');
            //endregion

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
        }
        //endregion

        //region Handle Data Table - Water Quality
        public function scopeDataTable(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone): void {
            $builder->select(
                't_parameter.*',
                DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") as datetime_formatted')
            );
            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
            $builder->orderBy('datetime_formatted', 'DESC');
        }
        //endregion

        //region Handle Data Table - Logs Parameter
        public function scopeDataLogsParameter(Builder $builder, $options = []): void {
            $platformUid = $options['platformUid'] ?? '';
            $tipeLogger = $options['tipeLogger'] ?? '';
            $interval = $options['interval'] ?? '';
            $tanggal = $options['tanggal'] ?? '';
            $minDate = $options['minDate'] ?? '';
            $maxDate = $options['maxDate'] ?? '';
            $bulan = $options['bulan'] ?? '';
            $tahun = $options['tahun'] ?? '';
            $statusPlatform = $options['statusPlatform'] ?? '';
            $timezone = $options['timezone'] ?? 'Asia/Jakarta';
            $sort = $options['sort'] ?? 'ASC';

            if ($interval == '') {
                $builder->select(
                    't_parameter.*',
                    DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '") as datetime_formatted'),
                    DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%H:%i"), "Asia/Makassar", "' . $timezone . '") as time_formatted'),
                );
            } else {
                $builder->select(
                    't_parameter.uid',
                    DB::raw('ROUND(AVG(t_parameter.temp), 2) as temp'),
                    DB::raw('ROUND(AVG(t_parameter.ph), 2) as ph'),
                    DB::raw('ROUND(AVG(t_parameter.cod), 2) as cod'),
                    DB::raw('ROUND(AVG(t_parameter.tss)) as tss'),
                    DB::raw('ROUND(AVG(t_parameter.nh3n), 2) as nh3n'),
                    DB::raw('ROUND(AVG(t_parameter.debit), 2) as debit'),
                    DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '") as datetime_formatted'),
                    DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%H:%i"), "Asia/Makassar", "' . $timezone . '") as time_formatted'),
                );
            }

            $builder->leftJoin('t_parameter_limit', function ($join) {
                $join->on('t_parameter.uid', '=', 't_parameter_limit.uid');
                $join->on('t_parameter.tipe_logger', '=', 't_parameter_limit.tipe_logger');
            });

            $builder->leftJoin('t_platform', function ($join) {
                $join->on('t_parameter.uid', '=', 't_platform.uid');
                $join->on('t_parameter.tipe_logger', '=', 't_platform.tipe_logger');
            });

            $builder->leftJoin('t_customer_site', 't_platform.site_id', '=', 't_customer_site.id');
            $builder->leftJoin('t_customer', 't_customer_site.customer_id', '=', 't_customer.id');
            $builder->leftJoin('t_jenis_industri', 't_customer.industri_id', '=', 't_jenis_industri.id');

            if ($statusPlatform != '') {
                if ($statusPlatform == '1') {
                    // Jika Normal
                    $builder->where(function ($query) use ($platformUid) {
                        $query->whereRaw('(IF(t_jenis_industri.paramPh = 1, IF(t_parameter.ph >= 1 AND (t_parameter.ph > ph_warn_min AND ph < ph_warn_max), "normal", IF((t_parameter.ph > ph_mutu_min AND ph <= ph_warn_min) OR (ph >= ph_warn_max AND ph < ph_mutu_max), "warning", "danger")), "normal") = "normal")');
                        $query->whereRaw('(IF(t_jenis_industri.paramCod = 1, IF(t_parameter.cod >= 1 AND t_parameter.cod < cod_warn, "normal", IF(t_parameter.cod >= cod_warn AND t_parameter.cod <= cod_mutu, "warning", "danger")), "normal") = "normal")');
                        $query->whereRaw('(IF(t_jenis_industri.paramTss = 1, IF(t_parameter.tss >= 1 AND (t_parameter.tss > tss_warn_min AND t_parameter.tss < tss_mutu_min), "normal", IF((t_parameter.tss > tss_warn AND tss <= tss_warn_min) OR (t_parameter.tss >= tss_mutu_min AND tss < tss_mutu), "warning", "danger")), "normal") = "normal")');
                        $query->whereRaw('(IF(t_jenis_industri.paramNh3n = 1, IF(t_parameter.nh3n >= 1 AND t_parameter.nh3n < nh3n_warn, "normal", IF(t_parameter.nh3n >= nh3n_warn AND t_parameter.nh3n <= nh3n_mutu, "warning", "danger")), "normal") = "normal")');
                        $query->whereRaw('(IF(t_jenis_industri.paramDebit = 1, IF((t_parameter.debit > debit_warn_min AND t_parameter.debit < debit_mutu_min OR (t_parameter.debit <= 0 AND t_parameter_limit.debit_intermit = 1)), "normal", IF((t_parameter.debit >= debit_warn AND t_parameter.debit <= debit_warn_min) OR (t_parameter.debit >= debit_mutu_min AND t_parameter.debit < debit_mutu), "warning", "danger")), "normal") = "normal")');
                    });
                }

                if ($statusPlatform == '2') {
                    // Jika Warning
                    $builder->where(function ($query) use ($platformUid) {
                        $query->whereRaw('(t_jenis_industri.paramPh = 1 AND ((t_parameter.ph > t_parameter_limit.ph_mutu_min AND t_parameter.ph <= t_parameter_limit.ph_warn_min) OR (t_parameter.ph >= t_parameter_limit.ph_warn_max AND t_parameter.ph < t_parameter_limit.ph_mutu_max)))');
                        $query->orWhereRaw('(t_jenis_industri.paramCod = 1 AND t_parameter.cod >= t_parameter_limit.cod_warn AND t_parameter.cod <= t_parameter_limit.cod_mutu)');
                        $query->orWhereRaw('(t_jenis_industri.paramTss = 1 AND (t_parameter.tss > t_parameter_limit.tss_warn AND tss <= t_parameter_limit.tss_warn_min) OR (t_parameter.tss >= t_parameter_limit.tss_mutu_min AND tss < t_parameter_limit.tss_mutu))');
                        $query->orWhereRaw('(t_jenis_industri.paramNh3n = 1 AND t_parameter.nh3n >= t_parameter_limit.nh3n_warn AND t_parameter.nh3n <= t_parameter_limit.nh3n_mutu)');
                        $query->orWhereRaw('(t_jenis_industri.paramDebit = 1 AND (t_parameter.debit >= t_parameter_limit.debit_warn AND t_parameter.debit < t_parameter_limit.debit_warn_min) OR (t_parameter.debit >= t_parameter_limit.debit_mutu_min AND t_parameter.debit < t_parameter_limit.debit_mutu))');
                    });
                }

                if ($statusPlatform == '3') {
                    // Jika Danger
                    $builder->where(function ($query) use ($platformUid) {
                        $query->whereRaw('(t_jenis_industri.paramPh = 1 AND (t_parameter.ph <= t_parameter_limit.ph_mutu_min AND t_parameter_limit.ph_intermit = 0) OR t_parameter.ph >= t_parameter_limit.ph_mutu_max)');
                        $query->orWhereRaw('(t_jenis_industri.paramCod = 1 AND (t_parameter.cod <= 0 AND t_parameter_limit.cod_intermit = 0) OR t_parameter.cod > t_parameter_limit.cod_mutu)');
                        $query->orWhereRaw('(t_jenis_industri.paramTss = 1 AND (t_parameter.tss <= t_parameter_limit.tss_warn AND t_parameter_limit.tss_intermit = 0) OR t_parameter.tss >= t_parameter_limit.tss_mutu)');
                        $query->orWhereRaw('(t_jenis_industri.paramNh3n = 1 AND (t_parameter.nh3n <= 0 AND t_parameter_limit.nh3n_intermit = 0) OR t_parameter.nh3n > t_parameter_limit.nh3n_mutu)');
                        $query->orWhereRaw('(t_jenis_industri.paramDebit = 1 AND (t_parameter.debit <= t_parameter_limit.debit_warn AND t_parameter_limit.debit_intermit = 0) OR t_parameter.debit >= t_parameter_limit.debit_mutu)');
                    });
                }
            }

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            // $builder->whereBetween(DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i")'), [$minDate, $maxDate]);

            if ($interval != '') {
                if ($interval == 1) {
                    $builder->where(DB::raw('DATE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '"))'), $tanggal);
                    $builder->groupBy(DB::raw('DATE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), "Asia/Makassar", "' . $timezone . '"))'));
                    $builder->groupBy(DB::raw('HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), "Asia/Makassar", "' . $timezone . '"))'));
                } else {
                    $builder->where(DB::raw('MONTH(CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '"))'), $bulan);
                    $builder->where(DB::raw('YEAR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '"))'), $tahun);
                    $builder->groupBy(DB::raw('DAY(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), "Asia/Makassar", "' . $timezone . '"))'));
                }
            } else {
                $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
            }

            $builder->orderBy('t_parameter.datetime_unix', 'DESC');
        }
        //endregion

        //region Handle Parameter By Uid
        public function scopeDataParameterByUid(Builder $builder, $options = []): void {
            $platformUid = $options['platformUid'] ?? '';
            $tipeLogger = $options['tipeLogger'] ?? '';
            $minDate = $options['minDate'] ?? '';
            $maxDate = $options['maxDate'] ?? '';
            $sort = $options['sort'] ?? '';
            $timezone = $options['timezone'] ?? '';

            $builder->select(
                't_parameter.*',
                DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '") as datetime_formatted'),
                DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%s"), "Asia/Makassar", "' . $timezone . '") as datetime'),
            );

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);

            if ($maxDate != '') {
                $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
            } else {
                $builder->where(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "' . $timezone . '")'), $minDate);
            }
            if ($sort != '') {
                $builder->orderBy('datetime_formatted', $sort);
            }
        }
        //endregion

        //region Handle Api Parameter By Uid
        public function scopeDataApiParameterByUid(Builder $builder, $options = []): void {
            $platformUid = $options['platformUid'] ?? '';
            $minDate = $options['minDate'] ?? '';
            $maxDate = $options['maxDate'] ?? '';
            $sort = $options['sort'] ?? '';
            $limit = $options['limit'] ?? null;

            $builder->select(
                't_parameter.*',
                't_parameter_limit.ph_mutu_min',
                't_parameter_limit.ph_mutu_max',
                't_parameter_limit.ph_warn_min',
                't_parameter_limit.ph_warn_max',
                't_parameter_limit.ph_intermit',
                't_parameter_limit.cod_mutu',
                't_parameter_limit.cod_warn',
                't_parameter_limit.cod_intermit',
                't_parameter_limit.tss_mutu',
                't_parameter_limit.tss_warn',
                't_parameter_limit.tss_intermit',
                't_parameter_limit.nh3n_mutu',
                't_parameter_limit.nh3n_warn',
                't_parameter_limit.nh3n_intermit',
                't_parameter_limit.debit_mutu',
                't_parameter_limit.debit_warn',
                't_parameter_limit.debit_intermit',
                DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i") as datetime_formatted'),
                DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i") as datetime'),
            );

            $builder->leftJoin('t_parameter_limit', 't_parameter.uid', '=', 't_parameter_limit.uid');
            $builder->where('t_parameter.uid', $platformUid);

            if ($maxDate != '') {
                $builder->whereBetween(DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i")'), [$minDate, $maxDate]);
            } else {
                $builder->where(DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i")'), $minDate);
            }
            if ($sort != '') {
                $builder->orderBy('datetime_formatted', $sort);
            }

            if ($limit != null) {
                $builder->limit($limit);
            }
        }
        //endregion

        //region Handle API Total Avg Harian
        public function scopeDataTotalAvgHarian(Builder $builder, $options): void {
            $platformUid = $options['platformUid'] ?? '';
            $minDate = $options['minDate'] ?? '';
            $maxDate = $options['maxDate'] ?? '';

            $builder->select(
                DB::raw('
                COUNT(t_parameter.id) AS total_data,
                ROUND(AVG(t_parameter.ph), 3) AS avg_ph,
                ROUND(AVG(t_parameter.cod), 3) AS avg_cod,
                ROUND(AVG(t_parameter.tss), 3) AS avg_tss,
                ROUND(AVG(t_parameter.nh3n), 3) AS avg_nh3n,
                ROUND(SUM(t_parameter.debit), 3) AS debit
            ')
            );

            $builder->where('t_parameter.uid', $platformUid);
            if ($maxDate != '') {
                $builder->whereBetween(DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i")'), [$minDate, $maxDate]);
            } else {
                $builder->where(DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i")'), $minDate);
            }
        }

        //endregion

        //region Handle Data Persentase Entry Weekly
        public function scopeDataPercentageEntryWeekly(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone, $totalSample): void {

            $builder->select([
                DB::raw("(COUNT(*) / $totalSample) * 100 as percentage")
            ]);

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
        }
        //endregion

        //region Handle Persentase Data Comply Weekly
        public function scopeDataPersentaseComplyWeekly(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone): void {
            $builder->select(
                DB::raw("((COUNT(tPhNormal.ph) + COUNT(tPhWarning.ph)) / COUNT(tHelpTotal.tPId)) * 100 as percentagePh"),
                DB::raw("((COUNT(tTssNormal.tss) + COUNT(tTssWarning.tss)) / COUNT(tHelpTotal.tPId)) * 100 as percentageTss"),
                DB::raw("((COUNT(tDebitNormal.debit) + COUNT(tDebitWarning.debit)) / COUNT(tHelpTotal.tPId)) * 100 as percentageDebit"),
            );

            //region Handle Join Total Data
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tHelpTotal
            '), 't_parameter.id', '=', 'tHelpTotal.tPId');
            //endregion


            //region Handle Join pH Mutu
            $builder->leftJoin(DB::raw('
            (
                SELECT
                    t_parameter.id AS tPId,
                    t_parameter.ph
                FROM
                    t_parameter
                    LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                WHERE
                      t_parameter.uid = "' . $platformUid . '"
                  AND t_parameter.tipe_logger = ' . $tipeLogger . '
                  AND ((t_parameter.ph < t_parameter_limit.ph_mutu_min AND t_parameter_limit.ph_intermit = 1) OR
                       t_parameter.ph <= t_parameter_limit.ph_mutu_max)
                  AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
            ) as tPhMutu
        '), 't_parameter.id', '=', 'tPhMutu.tPId');
            //endregion

            //region Handle Join pH Normal
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.ph
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.ph <= 0 AND t_parameter_limit.ph_intermit = 1) OR
                           (t_parameter.ph > t_parameter_limit.ph_warn_min AND t_parameter.ph < t_parameter_limit.ph_warn_max))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tPhNormal
            '), 't_parameter.id', '=', 'tPhNormal.tPId');
            //endregion

            //region Handle Join pH Warning
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.ph
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.ph > t_parameter_limit.ph_mutu_min AND t_parameter.ph <= t_parameter_limit.ph_warn_min) OR
                           (t_parameter.ph >= t_parameter_limit.ph_warn_max AND t_parameter.ph < t_parameter_limit.ph_mutu_max))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tPhWarning
            '), 't_parameter.id', '=', 'tPhWarning.tPId');
            //endregion

            //region Handle Join pH Danger
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.ph
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND (t_parameter.ph >= t_parameter_limit.ph_mutu_max OR
                          (t_parameter.ph <= t_parameter_limit.ph_mutu_min AND t_parameter_limit.ph_intermit = 0))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tPhDanger
            '), 't_parameter.id', '=', 'tPhDanger.tPId');
            //endregion


            //region Handle Join TSS Mutu
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.tss
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.tss < t_parameter_limit.tss_mutu AND t_parameter_limit.tss_intermit = 1) OR t_parameter.tss <= t_parameter_limit.tss_mutu)
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tTssMutu
            '), 't_parameter.id', '=', 'tTssMutu.tPId');
            //endregion

            //region Handle Join TSS Normal
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.tss
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.tss <= 0 AND t_parameter_limit.tss_intermit = 1) OR (t_parameter.tss > tss_warn_min AND t_parameter.tss < tss_mutu_min))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tTssNormal
            '), 't_parameter.id', '=', 'tTssNormal.tPId');
            //endregion

            //region Handle Join TSS Warning
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.tss
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.tss > tss_warn AND tss <= tss_warn_min) OR (t_parameter.tss >= tss_mutu_min AND tss < tss_mutu))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tTssWarning
            '), 't_parameter.id', '=', 'tTssWarning.tPId');
            //endregion

            //region Handle Join TSS Danger
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.tss
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND (t_parameter.tss >= t_parameter_limit.tss_mutu OR (t_parameter.tss <= tss_warn AND t_parameter_limit.tss_intermit = 0))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tTssDanger
            '), 't_parameter.id', '=', 'tTssDanger.tPId');
            //endregion


            //region Handle Join Debit Mutu
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit < t_parameter_limit.debit_mutu AND t_parameter_limit.debit_intermit = 1) OR t_parameter.debit < t_parameter_limit.debit_mutu)
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitMutu
            '), 't_parameter.id', '=', 'tDebitMutu.tPId');
            //endregion

            //region Handle Join Debit Normal
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit <= 0 AND t_parameter_limit.debit_intermit = 1) OR t_parameter.debit > debit_warn_min AND t_parameter.debit < debit_mutu_min)
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitNormal
            '), 't_parameter.id', '=', 'tDebitNormal.tPId');
            //endregion

            //region Handle Join Debit Warning
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND ((t_parameter.debit >= debit_warn AND t_parameter.debit <= debit_warn_min) OR (t_parameter.debit >= debit_mutu_min AND t_parameter.debit < debit_mutu))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitWarning
            '), 't_parameter.id', '=', 'tDebitWarning.tPId');
            //endregion

            //region Handle Join Debit Danger
            $builder->leftJoin(DB::raw('
                (
                    SELECT
                        t_parameter.id AS tPId,
                        t_parameter.debit
                    FROM
                        t_parameter
                        LEFT JOIN t_parameter_limit ON (t_parameter.uid = t_parameter_limit.uid AND t_parameter.tipe_logger = t_parameter_limit.tipe_logger)
                    WHERE
                          t_parameter.uid = "' . $platformUid . '"
                      AND t_parameter.tipe_logger = ' . $tipeLogger . '
                      AND (t_parameter.debit >= t_parameter_limit.debit_mutu OR (t_parameter.debit <= t_parameter_limit.debit_warn AND t_parameter_limit.debit_intermit = 0))
                      AND CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '") BETWEEN "' . $minDate . '" AND "' . $maxDate . '"
                ) as tDebitDanger
            '), 't_parameter.id', '=', 'tDebitDanger.tPId');
            //endregion

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
        }

        //endregion

        public function scopeDataAvgParameterWeekly(Builder $builder, $platformUid, $tipeLogger, $month, $year, $timezone): void {
            $builder->select([
                'uid',
                DB::raw('AVG(ph) as ph'),
                DB::raw('AVG(cod) as cod'),
                DB::raw('FLOOR(AVG(tss)) as tss'),
                DB::raw('AVG(nh3n) as nh3n'),
                DB::raw('AVG(debit) as debit')
            ]);

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->where(DB::raw('MONTH(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '"))'), '=', $month);
            $builder->where(DB::raw('YEAR(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '"))'), '=', $year);
        }

        public function scopeDataSensorWeekly(Builder $builder, $platformUid, $tipeLogger, $minDate, $maxDate, $timezone, $intervalMinutes = 2): void {

            $builder->select([
                'uid',
                DB::raw('AVG(ph) as ph'),
                DB::raw('AVG(cod) as cod'),
                DB::raw('FLOOR(AVG(tss)) as tss'),
                DB::raw('AVG(nh3n) as nh3n'),
                DB::raw('AVG(debit) as debit'),
                DB::raw("TIME(CONCAT(
                    HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar')),
                    ':',
                    LPAD(
                        FLOOR(
                            MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar')) / {$intervalMinutes}
                        ) * {$intervalMinutes},
                        2,
                        '0'
                    ),
                    ':00'
                )) as datetime_format"),
                DB::raw("CAST(
                    UNIX_TIMESTAMP(
                        CONCAT(
                            '2025-01-01',
                            ' ',
                            HOUR(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix), 'Asia/Makassar', 'Asia/Makassar')),
                            ':',
                            LPAD(
                                FLOOR(
                                    MINUTE(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix), 'Asia/Makassar', 'Asia/Makassar')) / 2
                                ) * 2,
                                2,
                                '0'
                            ),
                            ':00'
                        )
                    ) AS SIGNED
                ) as datetime_unix_interval")
            ]);

            $builder->where('t_parameter.uid', $platformUid);
            $builder->where('t_parameter.tipe_logger', $tipeLogger);
            $builder->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d"), "Asia/Makassar", "' . $timezone . '")'), [$minDate, $maxDate]);
            $builder->groupBy(
                DB::raw("HOUR(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar'))"),
                DB::raw("FLOOR(MINUTE(CONVERT_TZ(FROM_UNIXTIME(datetime_unix), 'Asia/Makassar', 'Asia/Makassar')) / {$intervalMinutes})")
            );
        }

        public function scopeLastParameterByUid(Builder $builder, string $uid): void {
            $builder->select(
                't_parameter.*',
                DB::raw('FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i") as datetime')
            );
            $builder->where('uid', $uid);
            $builder->orderBy('id', 'DESC');
        }

        public function scopeDataAvgParameter(Builder $builder, string $uid, $tipeLogger, $date): void {
            $builder->select([
                DB::raw('DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i"), "Asia/Makassar", "Asia/Makassar"), "%Y-%m-%d") AS datetime_format'),
                DB::raw('AVG(ph) AS nilai_ph'),
                DB::raw('FLOOR(AVG(tss)) AS nilai_tss'),
                DB::raw('(AVG(debit) * 1440) AS nilai_debit'),
                DB::raw('COUNT(ph) AS total_masuk'),
                'tipe_logger',
            ]);
            $builder->where('uid', $uid);
            $builder->where('tipe_logger', $tipeLogger);
            $builder->where(DB::raw('DATE(DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i"), "Asia/Makassar", "Asia/Makassar"), "%Y-%m-%d"))'), '=', $date);
            $builder->groupBy(['datetime_format', 'uid']);
        }

        public function scopeDataAvgMonthlyParameter(Builder $builder, string $uid, $tipeLogger, $date): void {
            $builder->select([
                DB::raw('MONTH(DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i"), "Asia/Makassar", "Asia/Makassar"), "%Y-%m-%d")) AS month'),
                DB::raw('YEAR(DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i"), "Asia/Makassar", "Asia/Makassar"), "%Y-%m-%d")) AS year'),
                DB::raw('AVG(ph) AS nilai_ph'),
                DB::raw('FLOOR(AVG(tss)) AS nilai_tss'),
                DB::raw('(AVG(debit) * 1440) AS nilai_debit'),
                DB::raw('COUNT(ph) AS total_masuk'),
                'tipe_logger',
            ]);
            $builder->where('uid', $uid);
            $builder->where('tipe_logger', $tipeLogger);
            $builder->where(DB::raw('DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i:%i"), "Asia/Makassar", "Asia/Makassar"), "%Y-%m")'), '=', $date);
            $builder->groupBy(['month', 'year', 'uid']);
        }

        public function scopeDataGapParameter(Builder $builder, $uid, $tipeLogger, $startDate, $untilDate): void {

            $dateRangeQuery = "SELECT (thousands.id * 1000 + hundreds.id * 100 + tens.id * 10 + units.id + 1) AS minute_number
                FROM
                    (SELECT 0 AS id UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) units,
                    (SELECT 0 AS id UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
                    (SELECT 0 AS id UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
                    (SELECT 0 AS id UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands";

            $builder->select([
                'summary.uid',
                DB::raw('
                    CONVERT_TZ(FROM_UNIXTIME(
                        summary.prev_datetime_unix + (n.minute_number * 120),
                        "%Y-%m-%d %H:%i"
                    ), "Asia/Makassar", "Asia/Makassar") AS datetime_format
                ')
            ]);

            $builder->from(function ($query) use ($uid, $tipeLogger, $startDate, $untilDate) {
                $query->select([
                    'uid',
                    'ph',
                    'tss',
                    'debit',
                    'datetime_unix',
                    'tipe_logger',
                    DB::raw('@prev_time AS prev_datetime_unix'),
                    DB::raw('ROUND(IF(@prev_time IS NOT NULL, (datetime_unix - @prev_time) / 60, 0)) AS gap_minutes'),
                    DB::raw('@prev_time := datetime_unix')
                ]);
                $query->fromRaw('t_parameter, (SELECT @prev_time := NULL) vars');
                $query->where('uid', '=', $uid);
                $query->where('tipe_logger', '=', $tipeLogger);
                $query->whereBetween(DB::raw('CONVERT_TZ(FROM_UNIXTIME(t_parameter.datetime_unix, "%Y-%m-%d %H:%i"), "Asia/Makassar", "Asia/Makassar")'), [$startDate, $untilDate]);
                $query->orderBy('datetime_unix');
            }, 'summary');

            $builder->crossJoinSub($dateRangeQuery, 'n');
            $builder->where('summary.gap_minutes', '>', 2);
            $builder->whereRaw('n.minute_number * 2 < summary.gap_minutes');
            $builder->orderBy('summary.datetime_unix');
        }
    }
