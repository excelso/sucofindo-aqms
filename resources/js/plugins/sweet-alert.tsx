import Swal, {SweetAlertOptions} from "sweetalert2"
import {transInit} from "@/js/plugins/lang";

export const confirmAlert = (options: SweetAlertOptions, isConfirmFn?: () => void, isCancelFn?: () => void) => {
    Swal.fire({
        ...options,
        customClass: {
            title: 'html-title',
            htmlContainer: 'html-container',
            confirmButton: 'btn btn-primary',
            denyButton: 'btn btn-error'
        }
    }).then((res) => {
        if (res.isConfirmed) {
            isConfirmFn()
            return false
        }

        if (typeof isCancelFn !== 'undefined') {
            if (res.isDenied || res.isDismissed) {
                isCancelFn()
                return false
            }
        }
    })
}

export const waitLoader = (title: string, html: string, didOpenCallback: () => void) => {
    return Swal.fire({
        html: `
            <div class="mt-4"><b>${title}</b></div>
            <div>${html}</div>
        `,
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false,
        timerProgressBar: true,
        customClass: {
            title: 'html-title',
            htmlContainer: 'html-container',
            confirmButton: 'btn btn-primary',
            denyButton: 'btn btn-error'
        },
        didOpen: async function () {
            Swal.showLoading();
            didOpenCallback()
        }
    })
}

export const successAlert = (options: SweetAlertOptions, isConfirmFn?: any) => {
    Swal.fire({
        ...options,
        icon: 'success',
        allowOutsideClick: false,
        customClass: {
            title: 'html-title',
            htmlContainer: 'html-container',
            confirmButton: 'btn btn-primary',
            denyButton: 'btn btn-error'
        },
    }).then((res) => {
        if (res.isConfirmed) {
            if (typeof isConfirmFn !== 'undefined') {
                isConfirmFn()
            }
            return false
        }
    })
}

export const failureAlert = (options: SweetAlertOptions, isConfirmFn?: () => void, isCancelFn?: () => void) => {
    const {trans} = transInit()
    Swal.fire({
        ...options,
        title: '<i class="fas fa-circle-xmark text-red-600 mr-1"></i> Oppss!',
        allowOutsideClick: false,
        showDenyButton: true,
        denyButtonText: `${trans('Cancel')}`,
        showConfirmButton: false,
        customClass: {
            title: 'html-title',
            htmlContainer: 'html-container',
            confirmButton: 'btn btn-primary',
            denyButton: 'btn btn-error'
        },
    }).then((res) => {
        if (res.isConfirmed) {
            if (typeof isConfirmFn !== 'undefined') {
                isConfirmFn()
            }
            return false
        }

        if (typeof isCancelFn !== 'undefined') {
            if (res.isDenied || res.isDismissed) {
                isCancelFn()
                return false
            }
        }
    })
}

export const closeAlert = () => {
    Swal.close()
}

export const notifAlert = (options: SweetAlertOptions) => {
    Swal.fire({
        icon: 'success',
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: {
            title: 'html-title',
            htmlContainer: 'html-container',
            confirmButton: 'btn btn-primary',
            denyButton: 'btn btn-error'
        },
        ...options
    }).then(null)
}
