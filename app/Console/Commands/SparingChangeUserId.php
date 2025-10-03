<?php

    namespace App\Console\Commands;

    use App\Models\Users\User;
    use DB;
    use Illuminate\Console\Command;

    class SparingChangeUserId extends Command {
        protected $signature = 'app:sparing-change-user-id';
        protected $description = 'Command description';

        public function handle() {
            $dataUser = User::get();
            $this->info("Processing {$dataUser->count()} users...");

            foreach ($dataUser as $user) {
                $this->info("Processing user: {$user->id} (id_sparing: {$user->id_sparing})");

                // Handle t_users_fcm
                $this->updateUsersFcm($user);

                // Handle t_users_sites
                $this->updateUsersSites($user);
            }

            $this->info("Done!");
        }

        private function updateUsersFcm($user) {
            try {
                // Ambil distinct FCM tokens
                $tokens = DB::connection('sparing-mysql')
                    ->table('t_users_fcm')
                    ->where('user_id', $user->id_sparing)
                    ->distinct()
                    ->pluck('fcm_token');

                foreach ($tokens as $token) {
                    // Update hanya 1 record per token
                    DB::connection('sparing-mysql')
                        ->table('t_users_fcm')
                        ->where('user_id', $user->id_sparing)
                        ->where('fcm_token', $token)
                        ->limit(1)
                        ->update(['user_id' => $user->id]);
                }

                // Hapus sisa duplikat yang tidak terupdate
                DB::connection('sparing-mysql')
                    ->table('t_users_fcm')
                    ->where('user_id', $user->id_sparing)
                    ->delete();

            } catch (\Exception $e) {
                $this->error("Error updating t_users_fcm for user {$user->id}: {$e->getMessage()}");
            }
        }

        private function updateUsersSites($user) {
            try {
                // Ambil kombinasi unique dari kolom-kolom yang membentuk composite key
                // Sesuaikan dengan struktur tabel Anda
                $sites = DB::connection('sparing-mysql')
                    ->table('t_users_sites')
                    ->where('user_id', $user->id_sparing)
                    ->get();

                // Group by site_id (atau field lain yang membentuk composite key)
                $grouped = $sites->groupBy('site_id'); // Sesuaikan field ini

                foreach ($grouped as $siteId => $records) {
                    // Update hanya record pertama dari setiap group
                    $firstRecord = $records->first();

                    DB::connection('sparing-mysql')
                        ->table('t_users_sites')
                        ->where('user_id', $user->id_sparing)
                        ->where('site_id', $siteId) // Sesuaikan field ini
                        ->limit(1)
                        ->update(['user_id' => $user->id]);
                }

                // Hapus sisa duplikat
                DB::connection('sparing-mysql')
                    ->table('t_users_sites')
                    ->where('user_id', $user->id_sparing)
                    ->delete();

            } catch (\Exception $e) {
                $this->error("Error updating t_users_sites for user {$user->id}: {$e->getMessage()}");
            }
        }
    }
