import {checkClassList} from "@/js/plugins/functions";

export const showModalDialog = (elm: Element, title?: string, callback?: any) => {
    if (checkClassList(elm, 'hidden')) {
        elm.classList.remove('hidden')
        document.body.classList.add('overflow-hidden')

        if (typeof title !== "undefined") {
            if (title !== null) {
                const titleElm = elm.querySelector('.modal-title')
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = title
                titleElm.replaceChildren(tempDiv)
            }
        }

        const event = new Event("show")
        elm.dispatchEvent(event)

        if (typeof callback !== "undefined") {
            callback()
        }
    }
}

export const closeModalDialog = (elm: Element, callback?: any) => {
    if (!checkClassList(elm, 'hidden')) {
        elm.classList.add('hidden')
        if (checkClassList(document.body, 'overflow-hidden')) {
            document.body.classList.remove('overflow-hidden')
            document.body.classList.add('overflow-auto')
        }

        if (typeof callback !== "undefined") {
            callback()
        }

        const event = new Event("hidden")
        elm.dispatchEvent(event)
    }
}
