import {ExBox} from "./exbox"

declare module './exbox' {
    interface ExBox {
        clearData(): void
    }
}

ExBox.prototype.clearData = function () {
    const exBoxSelect: HTMLSelectElement = document.querySelector(`#ex-box-select-${this.randId}`)
    if (exBoxSelect) {
        exBoxSelect.innerHTML = ''
        const optionElm = document.createElement('option')
        optionElm.value = ''
        optionElm.textContent = '...'

        exBoxSelect.appendChild(optionElm)
    }

    const exBoxRendered = document.querySelector(`#ex-box-rendered-${this.randId}`)
    if (exBoxRendered) {
        exBoxRendered.innerHTML = '...'
    }

    const exBoxResultOptions = document.querySelector(`#ex-box-result-options-${this.randId}`)
    if (exBoxResultOptions) {
        exBoxResultOptions.innerHTML = ''
    }
}
