<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f0f5;
            padding: 40px;
            text-align: center;
            color: #333;
        }
        .email-container {
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            max-width: 650px;
            margin: auto;
            box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
            text-align: left;
        }
        h2 {
            color: #2c3e50;
        }
        p {
            line-height: 1.6;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin-bottom: 10px;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .profile-photo {
            border-radius: 50%;
            border: 2px solid #3498db;
        }
    </style>
</head>
<body>

    <div class="email-container">
            <h2>Hello, {{ $data['first_name'] }} {{ $data['last_name'] }}</h2>
            <p>{{ $data['message'] }}</p>
            <p>Here are the details of your application:</p>
        <ul>
            <li><strong>Profile Photo:</strong> <a href="{{ url('/storage/'.$data['profile_photo'] ?? '#') }}" target="_blank">{{ $data['profile_photo'] ? 'View Photo' : '-' }}</a></li>
            <li><strong>First Name:</strong> {{ $data['first_name'] ?? '-' }}</li>
            <li><strong>Last Name:</strong> {{ $data['last_name'] ?? '-' }}</li>
            <li><strong>Email:</strong> {{ $data['email'] ?? '-' }}</li>
            <li><strong>Phone:</strong> {{ $data['phone_number'] ?? '-' }}</li>
            <li><strong>Resume/CV:</strong> <a href="{{ url('/storage/'.$data['resume'] ?? '#') }}" target="_blank">{{ $data['resume'] ? 'View Resume' : '-' }}</a></li>
            <li><strong>Education:</strong> {{ $data['education_name'] ?? '-' }}</li>
            <li><strong>Education Major:</strong> {{ $data['education_major_name'] ?? '-' }}</li>
            <li><strong>Latest Employer:</strong> {{ $data['latest_employer'] ?? '-' }}</li>
            <li><strong>Portfolio Link:</strong> <a href="{{ url($data['portfolio'] ?? '#') }}" target="_blank">{{ $data['portfolio'] ?? '-' }}</a></li>
        </ul>
        <p>Thank you,</p>
        <p><strong>Anzawara Team</strong></p>
    </div>
</body>
</html>