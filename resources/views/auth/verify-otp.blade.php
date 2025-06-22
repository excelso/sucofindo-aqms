<x-guest-layout>
    <div class="flex justify-center items-center h-screen">
        <div class="container mx-auto">
            <h1 class="text-2xl font-bold text-center mb-4">Verify OTP</h1>
            <p class="text-gray-600 text-center">Masukkan 6 digit kode yang dikirim ke</p>
            <p class="text-gray-600 text-center font-bold mb-8">{{ Auth::user()->email }}</p>
            <input type="hidden" class="emailUser" value="{{ Auth::user()->email }}">

            <form id="otpForm" class="mb-8">
                <!-- Container OTP -->
                <div id="otpContainer" class="flex justify-center gap-2 my-5">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input w-12 h-12 border-2 border-gray-300 rounded-md text-center text-2xl font-medium focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-all" maxlength="1" inputmode="numeric">
                </div>

                <div class="verifyError ds-alert ds-alert-error w-[350px] rounded-md mt-4 mx-auto mb-8" style="display: none;">
                    <div class="flex items-center text-white text-sm">
                        <div><i class="fas fa-exclamation-circle"></i></div>
                        <div class="verifyErrorText">Error</div>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="submit-button block mx-auto px-6 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors" disabled>
                    Verifikasi
                </button>
            </form>

            <div class="flex justify-center">
                <div class="font-bold countdown">00:00</div>
            </div>
            <div class="flex justify-center mb-10">
                <div>Tidak Menerima Kode OTP?</div>
                <div class="ml-1">
                    <button class="btnResendOTP text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed" disabled>Kirim Ulang</button>
                </div>
            </div>
            <div class="flex justify-center">
                <div>
                    <span>Kembali ke</span>
                    <a href="{{ route('login') }}" class="text-blue-500">Login</a>
                </div>
            </div>
        </div>
    </div>
</x-guest-layout>

@vite(['resources/js/login/verify-otp.tsx'])
