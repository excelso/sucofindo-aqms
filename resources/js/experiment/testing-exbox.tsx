import {ExBox} from "@/js/experiment/ex-box";

document.addEventListener('DOMContentLoaded', function () {
    const exBoxTest1: HTMLInputElement = document.querySelector('.exBoxTest1')
    new ExBox(exBoxTest1)

    exBoxTest1.addEventListener('change', (evt) => {
        const target = evt.target as HTMLInputElement
        console.log(target.value)
    })

    const exBoxTest2: HTMLInputElement = document.querySelector('.exBoxTest2')
    new ExBox(exBoxTest2)

    exBoxTest2.addEventListener('change', (evt) => {
        const target = evt.target as HTMLInputElement
        console.log(target.value)
    })
})
