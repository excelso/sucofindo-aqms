<?php

    namespace App\Http\Helper;

    use App\Http\Controllers\Controller;
    use App\Models\Companies\Companies;
    use App\Models\Employee\Employee;

    class ExImage extends Controller {
        public static function reCreateImageUrl($id): void {
            $userId = ExHash::decode($id);
            $w = isset($_GET['w']) ? intval($_GET['w']) : null;
            $h = isset($_GET['h']) ? intval($_GET['h']) : null;
            $q = isset($_GET['q']) ? intval($_GET['q']) : 90;

            $dataEmployee = Employee::where('user_id', $userId)->first('profile_picture');

            $image_url = public_path('storage/' . $dataEmployee->profile_picture);
            $image_info = getimagesize($image_url);
            $image_type = $image_info[2];

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    $image = imagecreatefromjpeg($image_url);
                    break;
                case IMAGETYPE_PNG:
                    $image = imagecreatefrompng($image_url);
                    break;
                case IMAGETYPE_GIF:
                    $image = imagecreatefromgif($image_url);
                    break;
                default:
                    die('Image format not supported!');
            }

            if ($w && $h) {
                $resized_image = imagescale($image, $w, $h);
            } elseif ($w) {
                $resized_image = imagescale($image, $w, -1);
            } elseif ($h) {
                $resized_image = imagescale($image, -1, $h);
            } else {
                $resized_image = $image;
            }

            if ($image_type == IMAGETYPE_PNG) {
                $output_image = imagecreatetruecolor(imagesx($resized_image), imagesy($resized_image));

                imagealphablending($output_image, false);
                imagesavealpha($output_image, true);

                $transparent = imagecolorallocatealpha($output_image, 0, 0, 0, 127);
                imagefilledrectangle($output_image, 0, 0, imagesx($resized_image), imagesy($resized_image), $transparent);

                imagecopy($output_image, $resized_image, 0, 0, 0, 0, imagesx($resized_image), imagesy($resized_image));
            } else {
                $output_image = $resized_image;
            }

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    header('Content-Type: image/jpeg');
                    imagejpeg($output_image, null, $q);
                    break;
                case IMAGETYPE_PNG:
                    header('Content-Type: image/png');
                    imagepng($output_image);
                    break;
                case IMAGETYPE_GIF:
                    header('Content-Type: image/gif');
                    imagegif($output_image);
                    break;
            }

            imagedestroy($image);
            imagedestroy($resized_image);
            imagedestroy($output_image);
        }

        public static function reCreateImageLogoUrl($id): void {
            $companyId = ExHash::decode($id);
            $w = isset($_GET['w']) ? intval($_GET['w']) : null;
            $h = isset($_GET['h']) ? intval($_GET['h']) : null;
            $q = isset($_GET['q']) ? intval($_GET['q']) : 90;

            $dataCompany = Companies::where('id', $companyId)->first('image_logo');

            $image_url = public_path('storage/' . $dataCompany->image_logo);
            $image_info = getimagesize($image_url);
            $image_type = $image_info[2];

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    $image = imagecreatefromjpeg($image_url);
                    break;
                case IMAGETYPE_PNG:
                    $image = imagecreatefrompng($image_url);
                    break;
                case IMAGETYPE_GIF:
                    $image = imagecreatefromgif($image_url);
                    break;
                default:
                    die('Image format not supported!');
            }

            if ($w && $h) {
                $resized_image = imagescale($image, $w, $h);
            } elseif ($w) {
                $resized_image = imagescale($image, $w, -1);
            } elseif ($h) {
                $resized_image = imagescale($image, -1, $h);
            } else {
                $resized_image = $image;
            }

            if ($image_type == IMAGETYPE_PNG) {
                $output_image = imagecreatetruecolor(imagesx($resized_image), imagesy($resized_image));

                imagealphablending($output_image, false);
                imagesavealpha($output_image, true);

                $transparent = imagecolorallocatealpha($output_image, 0, 0, 0, 127);
                imagefilledrectangle($output_image, 0, 0, imagesx($resized_image), imagesy($resized_image), $transparent);

                imagecopy($output_image, $resized_image, 0, 0, 0, 0, imagesx($resized_image), imagesy($resized_image));
            } else {
                $output_image = $resized_image;
            }

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    header('Content-Type: image/jpeg');
                    imagejpeg($output_image, null, $q);
                    break;
                case IMAGETYPE_PNG:
                    header('Content-Type: image/png');
                    imagepng($output_image);
                    break;
                case IMAGETYPE_GIF:
                    header('Content-Type: image/gif');
                    imagegif($output_image);
                    break;
            }

            imagedestroy($image);
            imagedestroy($resized_image);
            imagedestroy($output_image);
        }

        public static function reCreateImage($path): void {
            $w = isset($_GET['w']) ? intval($_GET['w']) : null;
            $h = isset($_GET['h']) ? intval($_GET['h']) : null;
            $q = isset($_GET['q']) ? intval($_GET['q']) : 90;

            $image_url = public_path('storage/' . $path);
            $image_info = getimagesize($image_url);
            $image_type = $image_info[2];

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    $image = imagecreatefromjpeg($image_url);
                    break;
                case IMAGETYPE_PNG:
                    $image = imagecreatefrompng($image_url);
                    break;
                case IMAGETYPE_GIF:
                    $image = imagecreatefromgif($image_url);
                    break;
                default:
                    die('Image format not supported!');
            }

            if ($w && $h) {
                $resized_image = imagescale($image, $w, $h);
            } elseif ($w) {
                $resized_image = imagescale($image, $w, -1);
            } elseif ($h) {
                $resized_image = imagescale($image, -1, $h);
            } else {
                $resized_image = $image;
            }

            if ($image_type == IMAGETYPE_PNG) {
                $output_image = imagecreatetruecolor(imagesx($resized_image), imagesy($resized_image));

                imagealphablending($output_image, false);
                imagesavealpha($output_image, true);

                $transparent = imagecolorallocatealpha($output_image, 0, 0, 0, 127);
                imagefilledrectangle($output_image, 0, 0, imagesx($resized_image), imagesy($resized_image), $transparent);

                imagecopy($output_image, $resized_image, 0, 0, 0, 0, imagesx($resized_image), imagesy($resized_image));
            } else {
                $output_image = $resized_image;
            }

            switch ($image_type) {
                case IMAGETYPE_JPEG:
                    header('Content-Type: image/jpeg');
                    imagejpeg($output_image, null, $q);
                    break;
                case IMAGETYPE_PNG:
                    header('Content-Type: image/png');
                    imagepng($output_image);
                    break;
                case IMAGETYPE_GIF:
                    header('Content-Type: image/gif');
                    imagegif($output_image);
                    break;
            }

            imagedestroy($image);
            imagedestroy($resized_image);
            imagedestroy($output_image);
        }
    }
