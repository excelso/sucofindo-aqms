<?php

    namespace App\Http\Helper;

    use Carbon\Carbon;
    use Carbon\CarbonInterval;
    use Exception;

    class Common {
        public static function numToExcelAlpha($n): int|string {
            $r = 'A';
            while ($n-- > 1) {
                $r++;
            }
            return $r;
        }

        public static function makeFilename($filename): array|string|null {
            // Memisahkan nama file dan ekstensi
            $fileInfo = pathinfo($filename);
            $name = $fileInfo['filename'];
            $extension = isset($fileInfo['extension']) ? '.' . $fileInfo['extension'] : '';

            // Membersihkan nama file
            $cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);

            // Menghapus multiple underscore
            $cleanName = preg_replace('/_+/', '_', $cleanName);

            // Menghapus underscore, tanda hubung, atau titik di awal
            $cleanName = preg_replace('/^[._-]+/', '', $cleanName);

            // Menghapus underscore, tanda hubung, atau titik di akhir
            $cleanName = preg_replace('/[._-]+$/', '', $cleanName);

            // Menggabungkan kembali dengan ekstensi
            return $cleanName . $extension;
        }

        public static function toMonth($angka) {
            try {
                $tanggal = Carbon::create(date('Y'), $angka);
                return $tanggal->translatedFormat('F');

            } catch (Exception $e) {
                return 'Bulan tidak valid';
            }
        }

        public static function getOrdinalNumber($n): string {
            $lastDigit = $n % 10;
            $lastTwoDigits = $n % 100;

            // Pengecualian untuk 11, 12, 13
            if ($lastTwoDigits >= 11 && $lastTwoDigits <= 13) {
                return $n . "th";
            }

            return match ($lastDigit) {
                1 => $n . "st",
                2 => $n . "nd",
                3 => $n . "rd",
                default => $n . "th",
            };
        }

        public static function formatDurasiJam($waktuString): string {
            // Parse durasi waktu dengan CarbonInterval
            $interval = CarbonInterval::createFromFormat('H:i:s', $waktuString);

            // Jika durasi kurang dari 1 jam dan tidak ada detik, tampilkan dalam format menit
            if ($interval->hours == 0 && $interval->seconds == 0) {
                return $interval->minutes . 'm';
            }

            if ($interval->minutes != 0) {
                return $interval->hours . 'h ' . $interval->minutes . 'm';
            } else {
                return $interval->hours . 'h';
            }
        }

        public static function hitungJarakHaversine($lat1, $lng1, $lat2, $lng2, $hasilDalamMil = false): float|int {
            // Radius bumi dalam kilometer
            $radiusBumi = 6371;

            // Konversi derajat ke radian
            $lat1 = deg2rad($lat1);
            $lng1 = deg2rad($lng1);
            $lat2 = deg2rad($lat2);
            $lng2 = deg2rad($lng2);

            // Selisih latitude dan longitude dalam radian
            $deltaLat = $lat2 - $lat1;
            $deltaLng = $lng2 - $lng1;

            // Formula Haversine
            $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
                cos($lat1) * cos($lat2) *
                sin($deltaLng / 2) * sin($deltaLng / 2);

            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

            // Jarak dalam kilometer
            $jarak = $radiusBumi * $c;

            // Konversi ke mil jika diperlukan
            if ($hasilDalamMil) {
                return $jarak * 0.621371;
            }

            return $jarak;
        }

        /**
         * Menghitung jarak antara dua lokasi menggunakan Google Maps Distance Matrix API
         *
         * @param float $lat1 Latitude titik pertama
         * @param float $lng1 Longitude titik pertama
         * @param float $lat2 Latitude titik kedua
         * @param float $lng2 Longitude titik kedua
         * @param string $mode Mode transportasi: 'driving', 'walking', 'bicycling', 'transit'
         * @param string $apiKey API Key Google Maps
         * @return array Hasil perhitungan jarak dan durasi
         */
        public static function hitungJarakGoogle(float $lat1, float $lng1, float $lat2, float $lng2, string $apiKey, string $mode = 'driving'): array {
            // Format koordinat
            $asal = $lat1 . ',' . $lng1;
            $tujuan = $lat2 . ',' . $lng2;

            // Buat URL untuk request ke API
            $url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins={$asal}&destinations={$tujuan}&mode={$mode}&key={$apiKey}";

            // Lakukan request ke API
            $response = file_get_contents($url);
            $data = json_decode($response, true);

            // Periksa status response
            if ($data['status'] !== 'OK') {
                return [
                    'status' => false,
                    'message' => 'Gagal mendapatkan data jarak: ' . $data['status']
                ];
            }

            // Ambil informasi jarak dan durasi
            $jarak = $data['rows'][0]['elements'][0]['distance']['text'];
            $nilai_jarak = $data['rows'][0]['elements'][0]['distance']['value']; // dalam meter
            $durasi = $data['rows'][0]['elements'][0]['duration']['text'];
            $nilai_durasi = $data['rows'][0]['elements'][0]['duration']['value']; // dalam detik

            return [
                'status' => true,
                'jarak_text' => $jarak,
                'jarak_meter' => $nilai_jarak,
                'jarak_km' => $nilai_jarak / 1000,
                'durasi_text' => $durasi,
                'durasi_detik' => $nilai_durasi,
                'durasi_menit' => $nilai_durasi / 60
            ];
        }
    }
