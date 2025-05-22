<?php

    namespace App\Rules;

    use Closure;
    use Illuminate\Contracts\Validation\ValidationRule;
    use Illuminate\Support\Facades\DB;

    class NotSimilarTo implements ValidationRule {
        /**
         * Create a new rule instance.
         */
        public function __construct(
            protected string  $table,
            protected string  $column,
            protected float   $threshold = 75,
            protected ?string $similarWord = null
        ) {
        }

        /**
         * Run the validation rule.
         *
         * @param string $attribute
         * @param mixed $value
         * @param Closure $fail
         */
        public function validate(string $attribute, mixed $value, Closure $fail): void {
            // Ambil semua nilai dari kolom yang ditentukan
            $existingValues = DB::table($this->table)
                ->whereNull('deleted_at')
                ->pluck($this->column)
                ->toArray();

            foreach ($existingValues as $existingValue) {
                // Hitung kemiripan menggunakan similar_text
                similar_text(
                    strtolower($value),
                    strtolower($existingValue),
                    $percentageSimilar
                );

                // Hitung jarak Levenshtein
                $levenshtein = levenshtein(
                    strtolower($value),
                    strtolower($existingValue)
                );

                // Hitung persentase Levenshtein
                $maxLength = max(strlen($value), strlen($existingValue));
                $levenshteinPercentage = (1 - $levenshtein / $maxLength) * 100;

                // Ambil rata-rata dari kedua metode
                $averagePercentage = ($percentageSimilar + $levenshteinPercentage) / 2;

                // Jika melewati threshold, berarti terlalu mirip
                if ($averagePercentage >= $this->threshold && $value !== $existingValue) {
                    $fail("This is too similar to existing value: {$existingValue}");
                    return;
                }
            }
        }
    }
