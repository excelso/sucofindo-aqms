<?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration {
        /**
         * Run the migrations.
         */
        public function up(): void {
            Schema::create('t_jobs_monitor', function (Blueprint $table) {
                $table->id()->comment('Primary key internal untuk identifikasi unik setiap job');

                $table->string('job_key', 64)
                    ->unique('uq_rekon_job_key')
                    ->comment('UUID unik yang menjadi identitas publik job, digunakan oleh front-end dan worker');

                $table->enum('job_type', ['internal', 'external'])
                    ->default('internal')
                    ->comment('Menentukan jenis proses rekon: internal atau eksternal');

                $table->dateTime('start_date')
                    ->comment('Tanggal awal periode rekon (rentang data yang akan diproses)');

                $table->dateTime('end_date')
                    ->comment('Tanggal akhir periode rekon (rentang data yang akan diproses)');

                $table->enum('status', ['pending', 'running', 'done', 'failed', 'cancelled'])
                    ->default('pending')
                    ->comment('Status eksekusi job saat ini: pending, running, done, failed, atau cancelled');

                $table->unsignedInteger('total_rows')
                    ->default(0)
                    ->nullable()
                    ->comment('Total baris data yang akan diproses pada periode rekon ini (dihitung di awal job)');

                $table->unsignedInteger('processed_rows')
                    ->default(0)
                    ->nullable()
                    ->comment('Jumlah baris data yang sudah diproses sejauh ini oleh worker');

                $table->decimal('progress_percent', 5, 2)
                    ->default(0.00)
                    ->nullable()
                    ->comment('Persentase kemajuan proses: (processed_rows / total_rows * 100)');

                $table->unsignedSmallInteger('batch_size')
                    ->default(1000)
                    ->nullable()
                    ->comment('Ukuran chunk/batch data per proses (misal 1000 baris per batch)');

                $table->string('message', 255)
                    ->nullable()
                    ->comment('Pesan terakhir atau catatan singkat dari worker (misal status batch terakhir atau error)');

                $table->boolean('cancel_requested')
                    ->default(0)
                    ->nullable()
                    ->comment('Menandakan apakah user/admin meminta pembatalan job (1 = ya)');

                $table->unsignedTinyInteger('retry_count')
                    ->default(0)
                    ->nullable()
                    ->comment('Jumlah percobaan ulang (retry) yang sudah dilakukan untuk job ini');

                $table->dateTime('last_heartbeat_at')
                    ->nullable()
                    ->comment('Waktu terakhir worker mengirim sinyal progress (heartbeat) untuk mendeteksi job hang');

                $table->dateTime('started_at')
                    ->nullable()
                    ->comment('Timestamp saat job benar-benar mulai dijalankan oleh worker');

                $table->dateTime('finished_at')
                    ->nullable()
                    ->comment('Timestamp saat job selesai atau gagal');

                $table->dateTime('created_at')
                    ->nullable()
                    ->useCurrent()
                    ->comment('Waktu pencatatan awal job (saat dibuat dari controller)');

                $table->dateTime('updated_at')
                    ->nullable()
                    ->useCurrent()
                    ->useCurrentOnUpdate()
                    ->comment('Waktu terakhir data job ini diperbarui (progress, status, dsb)');

                // Table comment
                $table->comment('Tabel tracking untuk seluruh proses rekonsiliasi (internal dan eksternal), menyimpan status, progress, serta metadata job');
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void {
            Schema::dropIfExists('t_jobs_monitor');
        }
    };
