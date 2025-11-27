<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Verify Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f7;
            color: #333;
        }

        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 20px;
            text-align: center;
        }

        .email-header {
            margin-bottom: 20px;
        }

        .email-header img {
            width: 200px;
        }

        .email-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
        }

        .email-body {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
        }

        .otp-code {
            display: inline-block;
            font-size: 32px;
            font-weight: bold;
            color: #333;
            background-color: #f4f4f7;
            padding: 10px 20px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #ddd;
        }

        .device-info {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
        }

        .device-info h3 {
            color: #444;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
        }

        .device-info p {
            margin: 5px 0;
            color: #666;
        }

        .device-info strong {
            color: #333;
        }

        .email-footer {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .email-footer a {
            color: #555;
            text-decoration: none;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://beenviro.beraucoal.co.id/images/logo-color.png" width="200" alt="Logo">
        </div>
        <div class="email-title">Verify Login</div>
        <div class="email-body">
            <p>Kami telah menerima permintaan Login dengan kode OTP berikut. Silakan masukkan kode OTP ini di tempat Anda memulai Login.</p>
            <div class="otp-code">{{ $data['otpToken'] }}</div>

            <div class="device-info">
                <h3>Informasi Perangkat</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; width: 100px; vertical-align: top;"><strong>Platform</strong></td>
                        <td style="padding: 5px 0; width: 10px; vertical-align: top;">:</td>
                        <td style="padding: 5px 0; vertical-align: top;">{{ ucfirst($data['device_platform']) }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; vertical-align: top;"><strong>Merk</strong></td>
                        <td style="padding: 5px 0; vertical-align: top;">:</td>
                        <td style="padding: 5px 0; vertical-align: top;">{{ ucfirst($data['device_brand']) }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; vertical-align: top;"><strong>Model</strong></td>
                        <td style="padding: 5px 0; vertical-align: top;">:</td>
                        <td style="padding: 5px 0; vertical-align: top;">{{ $data['device_name'] }}</td>
                    </tr>
                </table>
            </div>

            <p>Jika Anda tidak mencoba Login menggunakan perangkat tersebut tetapi menerima email ini, silakan abaikan dan hubungi administrator. Kode ini akan tetap aktif selama 1 menit.</p>
        </div>
        <div class="email-footer">
            <p>Berau Coal, Enabling A Brighter Future.</p>
            <p>
                <a href="#">GitHub</a> |
                <a href="#">Twitter</a> |
                <a href="#">Email</a>
            </p>
            <p>&copy; {{ date('Y') }} Berau Coal Energy. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
