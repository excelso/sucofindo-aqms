<?php

    namespace App\Http\Helper;

    class ExTextSimilarity {
        private int $threshold = 75; // Persentase minimum kemiripan

        /**
         * Mengecek kemiripan antara dua string
         *
         * @param string $text1 Teks yang akan dibandingkan
         * @param string $text2 Teks pembanding
         * @return array Result berisi status kemiripan dan persentase
         */
        public function checkSimilarity(string $text1, string $text2): array {
            // Ubah ke lowercase untuk menghindari case sensitive
            $text1 = strtolower($text1);
            $text2 = strtolower($text2);

            // Hitung kemiripan menggunakan similar_text
            similar_text($text1, $text2, $percentageSimilar);

            // Hitung jarak Levenshtein
            $levenshtein = levenshtein($text1, $text2);

            // Hitung persentase Levenshtein
            $maxLength = max(strlen($text1), strlen($text2));
            $levenshteinPercentage = (1 - $levenshtein / $maxLength) * 100;

            // Ambil rata-rata dari kedua metode
            $averagePercentage = ($percentageSimilar + $levenshteinPercentage) / 2;

            // Tentukan status kemiripan
            $isSimilar = $averagePercentage >= $this->threshold;

            return [
                'is_similar' => $isSimilar,
                'similarity_percentage' => round($averagePercentage, 2),
                'similar_text_percentage' => round($percentageSimilar, 2),
                'levenshtein_percentage' => round($levenshteinPercentage, 2),
                'levenshtein_distance' => $levenshtein
            ];
        }

        /**
         * Set threshold baru untuk kemiripan
         *
         * @param float $threshold Nilai threshold baru (0-100)
         */
        public function setThreshold(float $threshold): void {
            if ($threshold >= 0 && $threshold <= 100) {
                $this->threshold = $threshold;
            }
        }
    }
