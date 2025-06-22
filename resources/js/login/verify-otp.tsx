import {getMetaContent, show} from "@/js/plugins/functions";
import {successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import Swal from "sweetalert2";

document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = getMetaContent('csrf-token')
    const emailUser: HTMLInputElement = document.querySelector('.emailUser');
    const otpInputs = document.querySelectorAll('.otp-input');
    const submitButton = document.querySelector('.submit-button') as HTMLButtonElement;
    const countdown = document.querySelector('.countdown');
    const verifyError = document.querySelector('.verifyError');
    const verifyErrorText = document.querySelector('.verifyErrorText');
    const btnResendOTP: HTMLButtonElement = document.querySelector('.btnResendOTP');

    let timeLeft = 60;
    let timer = null;

    startTimer()
    handleSendOTP().then().catch((err) => {
        show(verifyError)
        verifyErrorText.textContent = err;
    })

    //region Handle Input OTP
    // Event untuk input
    otpInputs.forEach((input: Element, index: number) => {
        const inputElement = input as HTMLInputElement;

        // Handler untuk input dan keyup
        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement;

            // Hanya terima angka
            let value = target.value.replace(/[^0-9]/g, '');

            // Pastikan hanya satu digit
            if (value.length > 1) {
                value = value[value.length - 1];
            }

            // Update nilai input
            target.value = value;

            // Pindah ke input berikutnya jika ada nilai
            if (value.length === 1 && index < otpInputs.length - 1) {
                (otpInputs[index + 1] as HTMLInputElement).focus();
            }

            updateSubmitButton();
        };

        // Tambahkan kedua event listener
        inputElement.addEventListener('input', handleInput);
        inputElement.addEventListener('keyup', handleInput);

        // Handler untuk keydown (backspace)
        inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && !inputElement.value && index > 0) {
                e.preventDefault();
                (otpInputs[index - 1] as HTMLInputElement).focus();
                (otpInputs[index - 1] as HTMLInputElement).value = '';
            }
        });

        // Handler untuk paste
        inputElement.addEventListener('paste', (e: ClipboardEvent) => {
            e.preventDefault();
            const pastedData = e.clipboardData?.getData('text').replace(/[^0-9]/g, '');

            if (pastedData) {
                otpInputs.forEach((input: Element, idx: number) => {
                    const inputEl = input as HTMLInputElement;
                    inputEl.value = pastedData[idx] || '';
                });

                if (pastedData.length >= otpInputs.length) {
                    (otpInputs[otpInputs.length - 1] as HTMLInputElement).focus();
                } else if (pastedData.length > 0) {
                    (otpInputs[pastedData.length] as HTMLInputElement).focus();
                }
            }

            updateSubmitButton();
        });
    });

    // Update status tombol submit
    function updateSubmitButton(): void {
        const isComplete = Array.from(otpInputs).every((input: Element) =>
            (input as HTMLInputElement).value.length === 1
        );
        submitButton.disabled = !isComplete;
    }

    // Handle form submit
    if (submitButton) {
        submitButton.addEventListener('click', function (e) {
            e.preventDefault();
            const otp = Array.from(otpInputs)
                .map((input: Element) => (input as HTMLInputElement).value)
                .join('');

            submitButton.innerHTML = `<i class="fas fa-spinner fa-pulse mr-1"></i> Mohon Tunggu...`
            submitButton.disabled = true;

            handleVerifyOTP(otp).then(() => {
                window.location.href = '/';
            }).catch((error) => {
                show(verifyError)
                verifyErrorText.textContent = error;

                submitButton.innerHTML = `Verifikasi`
                submitButton.disabled = false;
            })
        })
    }

    function handleVerifyOTP(otp: string) {
        return new Promise(async (resolve, reject) => {
            const response = await fetch('verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    email: emailUser.value,
                    otp_token: otp,
                })
            })

            const {status} = response
            const {message} = await response.json()
            if (status === 200) {
                resolve(message);
            } else {
                reject(message);
            }
        })
    }

    // Focus input pertama
    (otpInputs[0] as HTMLInputElement).focus();

    //endregion

    async function handleSendOTP() {
        return new Promise(async (resolve, reject) => {
            await waitLoader('Mohon Tunggu...', 'Mengirim kode OTP ke email Anda', async () => {
                const response = await fetch('/verify-otp/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        email: emailUser.value,
                    })
                })

                const {status} = response
                const {message} = await response.json()
                if (status === 200) {
                    Swal.close()
                    resolve(message);
                } else {
                    Swal.close()
                    reject(message);
                }
            });
        })
    }

    //region Handle Resend OTP
    if (btnResendOTP) {
        btnResendOTP.addEventListener('click', async () => {
            await waitLoader('Mohon Tunggu...', 'Mengirim permintaan OTP baru', async () => {
                const response = await fetch('/verify-otp/resend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        email: emailUser.value,
                    })
                })

                const {status} = response
                const {message} = await response.json()
                if (status === 200) {
                    successAlert({
                        title: 'Berhasil',
                        html: message,
                        confirmButtonText: 'Tutup'
                    }, () => {
                        startTimer()
                    })
                } else {
                    Swal.close()

                    show(verifyError)
                    verifyErrorText.textContent = message;
                }
            })
        })
    }
    //endregion

    //region Handle Timer
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60)
        const seconds = timeLeft % 60

        countdown.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

        if (timeLeft === 0) {
            if (timer) clearInterval(timer)
            btnResendOTP.disabled = false
            return
        }

        timeLeft--
    }

    function startTimer() {
        timeLeft = 60
        if (timer) clearInterval(timer)

        timer = setInterval(updateTimer, 1000)
        updateTimer()
    }
    //endregion

});
