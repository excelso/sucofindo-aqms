import ExPicker from "@/js/experiment/ex-picker";

document.addEventListener('DOMContentLoaded', function () {
    const datepickerX: HTMLInputElement = document.querySelector('.datepickerX')
    const datepickerY: HTMLInputElement = document.querySelector('.datepickerY')

    const expickerX = new ExPicker(datepickerX, {
        locale: 'id-ID',
        autoClose: false,
    })

    const expickerY = new ExPicker(datepickerY, {
        dateFormat: 'yyyy-mm-dd',
        locale: 'id-ID',
        autoClose: true,
        onShow: (date) => {
            expickerY.setOption({
                minDate: datepickerX.value
            })
        }
    })
})
