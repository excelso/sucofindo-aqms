import {delay, getMetaContent} from "@/js/plugins/functions";

interface AutoCompleteOption {
    ajax: {
        url: string,
        data?: any,
        delay?: number,
        processData: (result: any[]) => any[],
        onClick?: (callback: any) => any
    }
}

export default class AutoComplete {
    csrfToken: string
    input: HTMLInputElement
    autoCompleteBody: any
    autoCompleteList: any
    autoCompleteItem: any
    options: AutoCompleteOption
    currentFocus: number
    xhr = new XMLHttpRequest()

    constructor(input: HTMLInputElement, options: AutoCompleteOption) {
        this.input = input
        this.options = options
        this.csrfToken = getMetaContent('csrf-token')

        input.addEventListener('input', delay(async () => {
            this.closeAllLists()
            if (!input.value) {
                return false
            }
            this.currentFocus = -1

            this.autoCompleteBody = document.createElement('DIV')
            this.autoCompleteBody.setAttribute('id', 'autocomplete-body')
            this.autoCompleteBody.setAttribute('class', 'autocomplete-body fixed bg-white')
            this.autoCompleteBody.setAttribute('style', `width: ${$(input).parent().width() + 1.5}px;`)

            this.autoCompleteList = document.createElement('DIV')
            this.autoCompleteList.setAttribute('class', 'autocomplete-list')
            this.autoCompleteBody.appendChild(this.autoCompleteList)

            if (input.parentElement instanceof HTMLLabelElement || input.parentElement instanceof HTMLDivElement) {
                // Jika Parent dari Input adalah Label
                input.parentElement.parentElement.insertBefore(this.autoCompleteBody, input.parentElement.nextElementSibling)
            } else {
                input.parentNode.insertBefore(this.autoCompleteBody, input.nextElementSibling)
            }

            this.processData(this.options).then((callback: {data: any[]}) => {
                let that = this
                const {
                    data
                } = callback

                if (data.length !== 0) {
                    data.forEach((item: any) => {
                        const {text, additional} = item
                        if (new RegExp(`(${this.input.value.toLowerCase()})`).test(text.toLowerCase())) {
                            this.autoCompleteItem = document.createElement('DIV')
                            this.autoCompleteItem.setAttribute('class', 'autocomplete-item')
                            this.autoCompleteItem.innerHTML = `${text.replace(new RegExp(`(${this.input.value.toLowerCase()})`, 'gi'), '<b>$&</b>')}`

                            if (additional) {
                                const parseAdditional = additional.split('#')
                                if (parseAdditional.length > 1) {
                                    parseAdditional.map((x) => {
                                        this.autoCompleteItem.innerHTML += `<div class="italic text-[12px]">${x}</div>`
                                    })
                                } else {
                                    this.autoCompleteItem.innerHTML += `<div class="italic text-[12px]">${additional}</div>`
                                }
                            }
                            this.autoCompleteItem.addEventListener('click', function () {
                                that.input.value = text
                                if (that.options.ajax.onClick) {
                                    that.options.ajax.onClick(item)
                                }

                                that.closeAllLists()
                            })
                            this.autoCompleteList.appendChild(this.autoCompleteItem)
                        }
                    })
                } else {
                    that.closeAllLists()
                }
            }).catch(() => {
                this.closeAllLists()
            })
        }, this.options.ajax.delay ?? 1500))

        input.addEventListener('keydown', function (e) {
            const autoCompleteItem: NodeListOf<HTMLElement> = document.querySelectorAll('.autocomplete-item')
            if (e.key === 'ArrowDown') {
                that.currentFocus++
                that.addActive(autoCompleteItem)
            } else if (e.key === 'ArrowUp') {
                that.currentFocus--
                that.addActive(autoCompleteItem)
            } else if (e.key === 'Enter') {
                e.preventDefault()

                if (that.currentFocus > -1) {
                    if (autoCompleteItem) autoCompleteItem[that.currentFocus].click()
                }
            }
        })

        let that = this
        document.addEventListener("click", function (e) {
            that.closeAllLists(e.target);
        })
    }

    private processData(options: AutoCompleteOption) {
        return new Promise(async (resolve, reject) => {
            let that = this

            this.xhr.open('POST', options.ajax.url)
            this.xhr.setRequestHeader('Content-Type', 'application/json')
            this.xhr.setRequestHeader('X-CSRF-TOKEN', this.csrfToken)
            this.xhr.onreadystatechange = function () {
                if (that.xhr.readyState === 4) {
                    const {message, data} = JSON.parse(that.xhr.responseText)
                    if (that.xhr.status === 200) {
                        resolve({
                            data: options.ajax.processData(data),
                            xhr: that.xhr
                        })
                    } else {
                        reject(message)
                    }
                }
            }

            this.xhr.send(JSON.stringify({
                ...options.ajax.data,
                query: this.input.value,
            }))
        })
    }

    private addActive(elm: NodeListOf<Element>) {
        if (!elm) return false;
        this.removeActive(elm)
        if (this.currentFocus >= elm.length) this.currentFocus = 0
        if (this.currentFocus < 0) this.currentFocus = (elm.length - 1)
        elm[this.currentFocus].classList.add('autocomplete-active')
    }

    private removeActive(elm: NodeListOf<Element>) {
        elm.forEach((e) => {
            e.classList.remove('autocomplete-active')
        })
    }

    private closeAllLists(elm?: HTMLElement | EventTarget) {
        const autoCompleteBody = document.getElementById('autocomplete-body')
        if (autoCompleteBody) {
            autoCompleteBody.remove()
        }
        const autoCompleteItem = document.querySelectorAll('.autocomplete-item')
        for (let i = 0; i < autoCompleteItem.length; i++) {
            if (elm != autoCompleteItem[i] && elm != this.input) {
                autoCompleteItem[i].parentNode.removeChild(autoCompleteItem[i])
            }
        }
    }
}
