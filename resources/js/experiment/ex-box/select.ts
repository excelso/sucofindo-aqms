import {ExBoxInterfaces, ExBoxOptionData} from "@/js/experiment/ex-box/interfaces";
import {Configs} from "@/js/experiment/ex-box/configs";
import {inArray} from "@/js/plugins/functions";
import {s} from "vite/dist/node/types.d-aGj9QkWt";

export class Select extends Configs {
    protected element: HTMLInputElement | HTMLSelectElement
    protected exBox: HTMLElement
    protected exBoxContainerResult: HTMLElement
    protected exBoxOptionData: ExBoxOptionData[]
    protected isExBoxVisible: boolean
    protected static openExBox: Select | null = null
    protected activeOption: HTMLElement | null = null
    protected currValueSelected: string
    protected currLabelSelected: string
    protected currentFocus: number = 0
    protected options: ExBoxInterfaces = {
        autoWidth: false,
        placeholder: 'Data not found!'
    }
    protected randId: string

    constructor(element: HTMLInputElement | HTMLSelectElement, options?: ExBoxInterfaces) {
        super()

        this.element = element
        this.options = {
            ...this.options,
            ...options
        }

        this.randId = this.randomId()
        this.element.style.display = 'none'
        this.element.id = `ex-box-select-${this.randId}`

        if (this.element instanceof HTMLSelectElement) {
            if (this.element.options[this.element.selectedIndex]) {
                this.currValueSelected = this.element.options[this.element.selectedIndex].value
                this.currLabelSelected = this.element.options[this.element.selectedIndex].textContent
            }

            this.element.addEventListener('exbox', (ev) => {
                const target = ev.target as HTMLSelectElement
                this.handleEventDispatch(target.value)
            })

            this.element.addEventListener('exbox.change', (ev) => {
                const target = ev.target as HTMLSelectElement
                this.setSelected(target.value)
            })
        }
    }

    protected render() {
        if (this.element.nextElementSibling) {
            this.element.nextElementSibling.remove()
        }

        this.createExBox()
        this.renderFirstOption()
    }

    //region Handle Create Select Box
    protected createExBox() {
        this.exBox = document.createElement('div')
        this.exBox.id = `ex-box-${this.randId}`
        this.exBox.setAttribute('data-uniq', this.randId)
        this.exBox.classList.add('ex-box')

        if (this.element.disabled) {
            this.exBox.classList.add('ex-box-disabled')
        }

        const exBoxContainer = document.createElement('div')
        exBoxContainer.classList.add('ex-box-container')

        const exBoxRendered = document.createElement('div')
        exBoxRendered.id = `ex-box-rendered-${this.randId}`
        exBoxRendered.classList.add('ex-box-rendered')

        exBoxContainer.appendChild(exBoxRendered)

        const exBoxArrow = document.createElement('div')
        exBoxArrow.classList.add('ex-box-arrow')

        exBoxContainer.appendChild(exBoxArrow)

        this.exBox.appendChild(exBoxContainer)
        this.element.insertAdjacentElement('afterend', this.exBox)
    }

    //endregion

    //region Handle Render Result
    protected renderResult() {
        if (Select.openExBox && Select.openExBox !== this) {
            Select.openExBox.removeExBox();
        }

        if (!this.isExBoxVisible) {
            this.createResult()
            this.createOptionSelect()
            this.handleOptionSearch()

            this.updatePosition()
            this.handleScrollToOptionSelected()

            const searchField: HTMLInputElement = document.querySelector(`#ex-box-search-field-${this.randId}`)
            searchField.focus()

            this.isExBoxVisible = true
            Select.openExBox = this;
        }
    }

    //endregion

    //region Handle Update Position
    protected updatePosition() {
        const inputPosition = this.exBox.getBoundingClientRect()
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight

        if (this.exBoxContainerResult) {
            this.exBoxContainerResult.style.top = `${inputPosition.bottom + scrollY - 3}px`
            this.exBoxContainerResult.style.left = `${inputPosition.left - 1}px`
            this.exBoxContainerResult.style.minWidth = `${inputPosition.width + 2}px`
            if (this.options.autoWidth) {
                this.exBoxContainerResult.style.maxWidth = `${inputPosition.width + 2}px`
            }

            this.exBoxContainerResult.style.zIndex = `9999`
            const exBoxResultPosition = this.exBoxContainerResult.getBoundingClientRect()

            if (Math.ceil(exBoxResultPosition.bottom) > windowHeight) {
                this.exBoxContainerResult.style.top = `${inputPosition.top - exBoxResultPosition.height + scrollY}px`
                this.exBoxContainerResult.style.left = `${inputPosition.left - 1}px`
                if (this.exBoxContainerResult.classList.contains('on-bottom')) {
                    this.exBoxContainerResult.classList.remove('on-bottom')
                }
                this.exBoxContainerResult.classList.add('on-top')

                const inputParent = this.getElementParent(this.element) as HTMLElement
                if (inputParent) {
                    this.exBoxContainerResult.style.top = `${inputPosition.top - exBoxResultPosition.height + scrollY + 5}px`
                    this.exBoxContainerResult.style.left = `${inputPosition.left - 1}px`
                    this.exBoxContainerResult.style.zIndex = `9999`
                }
            } else {
                if (this.exBoxContainerResult.classList.contains('on-top')) {
                    this.exBoxContainerResult.classList.remove('on-top')
                }
                this.exBoxContainerResult.classList.add('on-bottom')
            }
        }
    }

    //endregion

    //region Handle Render First Option
    protected renderFirstOption(textContent?: string) {
        const exBoxRendered = document.querySelector(`#ex-box-rendered-${this.randId}`)
        exBoxRendered.textContent = textContent ?? this.currLabelSelected
    }

    //endregion

    //region Handle Remove ExBox
    protected removeExBox() {
        if (this.exBoxContainerResult) {
            this.exBoxContainerResult.remove();
            this.exBoxContainerResult = null;
            this.isExBoxVisible = false;
        }
    }

    //endregion

    //region Handle Create Result
    protected createResult() {
        this.exBoxContainerResult = document.createElement('div')
        this.exBoxContainerResult.classList.add('ex-box-container-result')
        this.exBoxContainerResult.style.position = 'absolute'

        const exBoxDropdown = document.createElement('div')
        exBoxDropdown.classList.add('ex-box-dropdown')

        const exBoxSearch = document.createElement('div')
        exBoxSearch.classList.add('ex-box-search')

        const exBoxSearchField = document.createElement('input')
        exBoxSearchField.id = `ex-box-search-field-${this.randId}`
        exBoxSearchField.classList.add('ex-box-search-field')

        exBoxSearch.appendChild(exBoxSearchField)
        exBoxDropdown.appendChild(exBoxSearch)

        const exBoxResult = document.createElement('div')
        exBoxResult.classList.add('ex-box-result')

        const exBoxResultOptions = document.createElement('ul')
        exBoxResultOptions.id = `ex-box-result-options-${this.randId}`
        exBoxResultOptions.classList.add('ex-box-result-options')
        exBoxResultOptions.setAttribute('tabindex', '0')

        exBoxResult.appendChild(exBoxResultOptions)
        exBoxDropdown.appendChild(exBoxResult)

        this.exBoxContainerResult.appendChild(exBoxDropdown)
        document.body.appendChild(this.exBoxContainerResult)
    }

    //endregion

    //region Handle Create Option Data from Element Select
    protected createOptionData() {
        if (this.element instanceof HTMLSelectElement) {
            const optionDatas: ExBoxOptionData[] = []
            for (let i = 0; i < this.element.options.length; i++) {
                const value = this.element.options[i].value
                const textContent = this.element.options[i].textContent
                const additional = this.element.options[i].getAttribute('data-additional')
                const infos = this.element.options[i].getAttribute('data-infos')

                optionDatas.push({
                    value: value,
                    label: textContent,
                    additional: additional,
                    infos: infos,
                })
            }

            this.exBoxOptionData = optionDatas
            return optionDatas
        }
    }

    //endregion

    //region Handle Create Options Data Element
    public createOptionDataElement(optionData?: ExBoxOptionData[]) {
        const exBoxSelect: HTMLSelectElement = document.querySelector(`#ex-box-select-${this.randId}`)
        if (exBoxSelect) {
            exBoxSelect.innerHTML = ''
            optionData.map((item) => {
                const optionElm = document.createElement('option')
                optionElm.value = item.value
                optionElm.textContent = item.label

                if (item.additional) {
                    optionElm.setAttribute('data-additional', item.additional)
                }

                if (item.infos) {
                    optionElm.setAttribute('data-infos', item.infos)
                }
                exBoxSelect.appendChild(optionElm)
            })
        }
    }

    //endregion

    //region Handle Create Option Select
    protected createOptionSelect(optionData?: ExBoxOptionData[]) {
        const exBoxResultOptions = document.querySelector(`#ex-box-result-options-${this.randId}`)
        exBoxResultOptions.innerHTML = ''

        const optionDatas = optionData ?? this.createOptionData()
        if (optionDatas.length !== 0) {
            optionDatas.map((item) => {
                const {
                    value,
                    label,
                    additional
                } = item

                const optionSelect = document.createElement('li')
                optionSelect.classList.add('ex-box-result-options-select')
                optionSelect.textContent = `${label}`
                optionSelect.setAttribute('data-value', value)
                optionSelect.setAttribute('role', 'option')

                if (additional) {
                    const additionalData = document.createElement('div')
                    additionalData.classList.add('additional')
                    additionalData.style.fontStyle = 'italic'
                    additionalData.style.fontSize = '13px'
                    additionalData.textContent = additional
                    optionSelect.appendChild(additionalData)
                }

                if (item.value === this.currValueSelected) {
                    this.activeOption = optionSelect
                    optionSelect.classList.add('selected')
                }

                optionSelect.addEventListener('click', (evt) => this.handleOptionClick(evt))
                exBoxResultOptions.appendChild(optionSelect)
            })
        } else {
            const optionSelect = document.createElement('li')
            optionSelect.id = `ex-box-result-options-select-${this.randId}`
            optionSelect.classList.add('ex-box-result-options-select')
            optionSelect.textContent = this.options.placeholder
            exBoxResultOptions.appendChild(optionSelect)
        }
    }

    //endregion

    //region Handle Option Click
    protected handleOptionClick(event: Event) {
        const clickedOption = event.currentTarget as HTMLOptionElement
        if (this.element instanceof HTMLSelectElement) {
            if (this.activeOption) {
                this.activeOption.classList.remove('selected')
            }

            clickedOption.classList.add('selected')
            this.activeOption = clickedOption
            const optionValue = clickedOption.getAttribute('data-value')
            let optionLabel = clickedOption.textContent
            clickedOption.childNodes.forEach((item) => {
                if (item.nodeType === Node.TEXT_NODE) {
                    optionLabel = item.textContent
                }
            })

            const option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${optionValue}"]`)
            if (option) {
                this.removeAllSelectedAttribute()
                option.setAttribute('selected', 'selected')
                this.currValueSelected = optionValue
                this.currLabelSelected = optionLabel
                this.renderFirstOption()
                this.element.value = optionValue
                this.element.dispatchEvent(new Event('change', {bubbles: true}))
            }
            this.removeExBox()
        }
    }

    //endregion

    //region Handle Option Search and Move Selection
    protected handleOptionSearch() {
        const optionDatas = this.createOptionData()
        const searchOption = document.querySelector(`#ex-box-search-field-${this.randId}`)
        searchOption.addEventListener('keyup', (evt: KeyboardEvent) => {
            if (!inArray(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'], evt.key)) {
                const target = evt.target as HTMLInputElement
                const filtered = optionDatas.filter(element => {
                    for (const value of Object.values(element)) {
                        if (value) {
                            if (value.toString().toLowerCase().includes(target.value.toLowerCase())) return true;
                        }
                    }
                })

                this.createOptionSelect(filtered)
                this.updatePosition()
            } else {
                const optionItem: NodeListOf<HTMLElement> = document.querySelectorAll('.ex-box-result-options-select')
                switch (evt.key) {
                    case 'ArrowDown':
                        this.currentFocus++
                        this.moveSelection(optionItem)
                        break
                    case 'ArrowUp':
                        this.currentFocus--
                        this.moveSelection(optionItem)
                        break
                    case 'Enter':
                        evt.preventDefault()
                        this.handleOptionEnter(optionItem)
                        break
                }
            }
        })
    }

    //endregion

    //region Handle Option Enter
    protected handleOptionEnter(elm: NodeListOf<HTMLElement>) {
        if (this.element instanceof HTMLSelectElement) {

            if (this.activeOption) {
                this.activeOption.classList.remove('selected')
            }

            elm[this.currentFocus].classList.add('selected')
            this.activeOption = elm[this.currentFocus]
            const optionValue = elm[this.currentFocus].getAttribute('data-value')
            const optionLabel = elm[this.currentFocus].textContent

            const option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${optionValue}"]`)
            if (option) {
                this.removeAllSelectedAttribute()
                option.setAttribute('selected', 'selected')
                this.currValueSelected = optionValue
                this.currLabelSelected = optionLabel
                this.renderFirstOption()
                this.element.value = optionValue
                this.element.dispatchEvent(new Event('change', {bubbles: true}))
            }
            this.removeExBox()
        }
    }

    //endregion

    //region Handle Move Selection
    protected moveSelection(elm: NodeListOf<Element>) {
        if (!elm) return false;
        this.removeActiveSelection(elm)
        if (this.currentFocus >= elm.length) this.currentFocus = 0
        if (this.currentFocus < 0) this.currentFocus = (elm.length - 1)
        elm[this.currentFocus].classList.add('active')
    }

    //endregion

    //region Handle Remove Active Selection
    private removeActiveSelection(elm: NodeListOf<Element>) {
        elm.forEach((e) => {
            e.classList.remove('active')
        })
    }

    //endregion

    //region Handle Scroll To Option Select
    protected handleScrollToOptionSelected() {
        const exBoxResultOptions = document.querySelector('.ex-box-result-options')
        const exBoxResultOptionSelect = document.querySelectorAll('.ex-box-result-options-select')
        exBoxResultOptionSelect.forEach((elm: HTMLElement) => {
            const optionValue = elm.getAttribute('data-value')

            if (this.currValueSelected === optionValue) {
                exBoxResultOptions.scrollTop = elm.offsetTop - 83
            }
        })
    }

    //endregion

    //region Handle Remove All Selected Attribute
    protected removeAllSelectedAttribute() {
        const option = this.element.querySelectorAll(`option`)
        option.forEach((elm) => {
            if (elm.hasAttribute('selected')) {
                elm.removeAttribute('selected')
            }
        })
    }

    //endregion

    //region Handle Set Selected Value
    public setSelected(val: string) {
        if (this.element instanceof HTMLSelectElement) {
            if (this.element.disabled) {
                this.exBox.classList.add('ex-box-disabled')
            } else {
                this.exBox.classList.remove('ex-box-disabled')
            }

            const option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${val}"]`)
            if (option) {
                this.removeAllSelectedAttribute()
                this.currValueSelected = option.value
                this.currLabelSelected = option.textContent
                option.setAttribute('selected', 'selected')
                this.renderFirstOption()

                this.element.value = val
                this.element.dispatchEvent(new Event('change'))
            }
        }
    }

    //endregion

    //region Handle Set Selected Value Without Dispatch Event
    protected handleEventDispatch(val: string) {
        if (this.element instanceof HTMLSelectElement) {
            if (this.element.disabled) {
                this.exBox.classList.add('ex-box-disabled')
            } else {
                this.exBox.classList.remove('ex-box-disabled')
            }

            const option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${val}"]`)
            if (option) {
                this.removeAllSelectedAttribute()
                this.currValueSelected = option.value
                this.currLabelSelected = option.textContent
                option.setAttribute('selected', '')
                this.renderFirstOption()

                this.element.value = val
            }
        }
    }

    //endregion

}
