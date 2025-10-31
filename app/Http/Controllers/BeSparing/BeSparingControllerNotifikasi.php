<?php

    namespace App\Http\Controllers\BeSparing;

    use App\Http\Controllers\Controller;
    use App\Jobs\BeSparingFirebaseSendMessage;
    use App\Jobs\BeSparingNotificationRead;
    use App\Models\BeSparing\Notifikasi;
    use App\Models\BeSparing\NotifikasiRead;
    use App\Models\BeSparing\User;
    use App\Models\Users\UserFirebase;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Mail\Markdown;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\Crypt;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Http;

    class BeSparingControllerNotifikasi extends Controller {

        protected Notifikasi $notifikasi;
        protected NotifikasiRead $notifikasi_read;

        public function __construct() {
            $this->notifikasi = new Notifikasi();
            $this->notifikasi_read = new NotifikasiRead();
        }

        public function getDataNotifikasi(): JsonResponse {
            try {
                $dataUserSparing = User::where('id', request()->user()->id_sparing)->first();
                $dataNotifikasi = Notifikasi::dataNotifikasi($dataUserSparing->user_uniq_id ?? null);

                $totalRows = $dataNotifikasi->count();
                if (request()->input('loadMore') != null) {
                    $dataNotif = $dataNotifikasi->limit(10)->offset(request()->input('loadMore'))->get();
                } else {
                    $dataNotif = $dataNotifikasi->limit(10)->get();
                }

                $data = [];
                foreach ($dataNotif as $item) {
                    $link = '';
                    if ($item->module == 'TicketSupport') {
                        $parseData = json_decode($item->data_notif);
                        $link = '/ticket-support/view/' . Crypt::encrypt($parseData->data->id);
                    }

                    $data[] = [
                        'id' => $item->id,
                        'title' => $item->title,
                        'detail' => Markdown::parse(preg_replace('/[\r\n]/', '', $item->detail))->toHtml(),
                        'link' => $link,
                        'kategori' => $item->kategori,
                        'readed' => $item->readed,
                        'created_at' => Carbon::parse($item->created_at)->timezone('Asia/Jakarta')->translatedFormat('d M Y - H:i'),
                        'nama_pengirim' => $item->senderId->nama_lengkap ?? null,
                    ];
                }

                return response()->json([
                    'message' => 'Notifikasi Ditemukan',
                    'totalRows' => $totalRows,
                    'dataResponse' => $data,
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function getCountNotifikasi(): JsonResponse {
            try {
                $dataUserSparing = User::where('id', request()->user()->id_sparing)->first();
                $dataNotifikasi = Notifikasi::dataCountNotifikasi($dataUserSparing->user_uniq_id ?? null);
                return response()->json([
                    'message' => 'Notifikasi Ditemukan',
                    'dataResponse' => $dataNotifikasi->count(),
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function markAllReadNotifikasi(): JsonResponse {
            try {

                //region Sementara tidak dipakai
                // $dataNotifikasiUnread = Notifikasi::dataCountNotifikasi(request()->user()->user_uniq_id)->get();
                // if ($dataNotifikasiUnread->count() != 0) {
                //     foreach ($dataNotifikasiUnread as $item) {
                //         NotifikasiRead::create([
                //             'notifikasi_id' => $item->id,
                //             'user_uniq_id' => request()->user()->user_uniq_id,
                //             'readed' => 1
                //         ]);
                //     }
                // } else {
                //     return response()->json([
                //         'message' => 'Semua Notifikasi sudah dibaca',
                //         'responseTime' => now()
                //     ]);
                // }
                //endregion

                $this->dispatch(new BeSparingNotificationRead(request()->user()->user_uniq_id));
                return response()->json([
                    'message' => 'Baca semua Notifikasi berhasil',
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function readNotifikasi(Request $request): JsonResponse {
            try {
                $dataNotifRead = (new NotifikasiRead)
                    ->where('notifikasi_id', $request->input('notifikasi_id'))
                    ->where('user_uniq_id', request()->user()->user_uniq_id)
                    ->count();

                if ($dataNotifRead == 0) {
                    NotifikasiRead::create([
                        'notifikasi_id' => $request->input('notifikasi_id'),
                        'user_uniq_id' => request()->user()->user_uniq_id,
                        'readed' => 1
                    ]);
                } else {
                    return response()->json([
                        'message' => 'Notification Already Read!',
                        'responseTime' => now()
                    ]);
                }

                return response()->json([
                    'message' => 'Read Notification Success!',
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function saveFirebaseRegToken(Request $request): JsonResponse {
            DB::beginTransaction();
            try {

                $existToken = UserFirebase::where('fcm_token', $request->input('firebaseReqToken'))->where('user_id', request()->user()->id)->count();
                if ($existToken == 0) {
                    (new UserFirebase)->create([
                        'user_id' => request()->user()->id,
                        'fcm_token' => $request->input('firebaseReqToken'),
                        'device_platform' => 'web',
                        'device_brand' => $request->header('User-Agent'),
                        'app_version' => env('APP_VER', '2.0.0'),
                        'user_status' => 'login',
                    ]);
                } else {
                    (new UserFirebase)->where('user_id', $request->user()->id)
                        ->where('fcm_token', $request->input('firebaseReqToken'))
                        ->update([
                            'user_status' => 'login'
                        ]);
                }

                DB::commit();
                return response()->json([
                    'message' => 'Save Token Success!',
                    'responseTime' => now()
                ])->withCookie(cookie('FCM_TOKEN', $request->input('firebaseReqToken')));
            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function sendMessage($options = []): bool {
            $to = $options['to'];
            $title = $options['title'];
            $body = $options['body'];
            $payload = $options['payload'];

            $sendMessage = Http::withToken(env('FIREBASE_SERVER_KEY', ''))
                ->timeout(30)
                ->post(env('FIREBASE_SEND_URL', ''), [
                    'to' => $to,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'sound' => "bell.wav"
                    ],
                    'data' => $payload
                ]);

            if ($sendMessage->failed()) return false;
            return true;
        }

        public function sendMessageToQueue($options = []): JsonResponse {
            try {
                $to = $options['to'];
                $title = $options['title'];
                $body = $options['body'];
                $payload = $options['payload'];

                $this->dispatch(
                    new BeSparingFirebaseSendMessage([
                        'to' => $to,
                        'title' => $title,
                        'body' => $body,
                        'payload' => $payload
                    ])
                );

                return response()->json([
                    'message' => 'Success!',
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function testSendMessage() {
            $to = 'el0BqR-JLUqkqOPo-frOy-:APA91bH_8Zj6sf-ZwtXvpdrvqqmYXRdc5nu13Bbh889NrkvcSpPJ4Sw3T45Bnjfg5nlZgbzd2Do1j4c2BRcLXh28F1YNLhDq9NbI9T31roAFtxgk9o-sLdIyvpJKdQFawAXBgX2Etlfi';
            // $to = 'cPMdXncLmldjWPQbxobhZU:APA91bFSvO-Y-V_8Hp5o8xJ5K0w4GTmyV1oScG-KsC2BjzyZOEIAcn_7I4A7ZKerX-fwa0duCcydaYBHFEDcm8OYw7FrpdmCdYdmkT4Dk8YSB1cXjpeFohatoGjhfThFj0iFnp0QMG0i';
            $title = 'Test';
            $body = 'Hallo ini Test Notif';
            $payload = [
                'modul' => 'account_planning',
                'id' => 1,
                'type' => 'request_approved',
                'user_receiver_id' => 1
            ];

            $sendMessage = Http::withToken(env('FIREBASE_SERVER_KEY', ''))
                ->timeout(30)
                ->post(env('FIREBASE_SEND_URL', ''), [
                    'to' => $to,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'sound' => "bell.wav"
                    ],
                    'data' => $payload
                ]);

            if ($sendMessage->failed()) return false;
            return $sendMessage;
        }

        public function testFirebaseQueue(): JsonResponse {
            try {
                $this->dispatch(new BeSparingFirebaseSendMessage([
                    'to' => 'e6qVpc9wEnU9nDcyHwMHXk:APA91bESNskbtADoBdC2BX8h9ElDeuPNRgyNJS_1XJEKM6HS2vIEil6-GR0PmhSLO1BbMspgQomy7FGmuSc9YQ_MsQZGfoMeJ5V6eSU-x-w8pUo2nYIGE_rSqCklQONloA-_uJ2NlQGz',
                    'title' => 'Test',
                    'body' => 'Hallo ini Test Notif',
                    'payload' => [
                        'modul' => 'account_planning',
                        'id' => 1,
                        'type' => 'request_approved',
                        'user_receiver_id' => 3
                    ]
                ]));

                return response()->json([
                    'message' => 'Test kirim ke Queue berhasil! Silahkan cek pakai "php artisan queue:work" di Terminal',
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

    }
