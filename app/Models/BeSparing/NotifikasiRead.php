<?php

    namespace App\Models\BeSparing;

    use Illuminate\Database\Eloquent\Model;

    class NotifikasiRead extends Model {

        protected $connection = 'sparing-mysql';
        protected $guarded = [];
        protected $table = 't_notifikasi_read';

    }
