<?php

    namespace App\Models\Master;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;

    class AqiCategories extends Model {

        protected $table = 't_aqi_categories';
        protected $fillable = [
            'category_name',
            'category_name_en',
            'aqi_min',
            'aqi_max',
            'pm25_min',
            'pm25_max',
            'pm10_min',
            'pm10_max',
            'color_code',
            'emoji',
            'health_advice',
        ];

        public function scopeDataAqiPm25(Builder $builder, $pm25): void {
            $builder->where('pm25_min', '<=', $pm25);
            $builder->where('pm25_max', '>=', $pm25);
        }

        public function scopeDataAqiIndex(Builder $builder, $aqiIndex): void {
            $builder->where('aqi_min', '<=', $aqiIndex);
            $builder->where('aqi_max', '>=', $aqiIndex);
        }
    }
