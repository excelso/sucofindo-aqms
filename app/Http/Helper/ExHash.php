<?php

    namespace App\Http\Helper;

    use Hashids\Hashids;

    class ExHash {
        // Encryption
        public static function encode($id): string {
            $hashids = new Hashids(config('app.key'), 10);
            return $hashids->encode($id);
        }

        // Decryption
        public static function decode($encodedId) {
            $hashids = new Hashids(config('app.key'), 10);
            $decoded = $hashids->decode($encodedId);
            return $decoded[0] ?? null;
        }
    }
