import {ExBoxInterfaces, ExBoxOptionData} from "@/js/experiment/ex-box/interfaces";
import {Configs} from "@/js/experiment/ex-box/configs";
import {inArray} from "@/js/plugins/functions";

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
        placeholder: 'Data not found!',
        maxWidth: undefined,
        dropdownAutoPosition: true
    }
    protected randId: string
    protected ajaxCache: Map<string, ExBoxOptionData[]> = new Map()
    protected isLoading: boolean = false
    protected searchTimeout: ReturnType<typeof setTimeout> | null = null

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

            // Jika menggunakan AJAX, jangan create option dari elemen select
            if (!this.options.ajax) {
                this.createOptionSelect()
            } else {
                // Untuk AJAX, tampilkan loading atau placeholder
                this.showLoadingOrPlaceholder()
            }

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

    //region Handle Show Loading or Placeholder for AJAX
    protected showLoadingOrPlaceholder() {
        const exBoxResultOptions = document.querySelector(`#ex-box-result-options-${this.randId}`)
        exBoxResultOptions.innerHTML = ''

        const optionSelect = document.createElement('li')
        optionSelect.classList.add('ex-box-result-options-select', 'loading-placeholder')

        if (this.options.ajax?.minimumInputLength && this.options.ajax.minimumInputLength > 0) {
            optionSelect.textContent = `Please enter ${this.options.ajax.minimumInputLength} or more characters`
        } else {
            optionSelect.textContent = 'Start typing to search...'
        }

        exBoxResultOptions.appendChild(optionSelect)
    }

    //endregion

    //region Handle AJAX Request
    protected async performAjaxRequest(searchTerm: string): Promise<ExBoxOptionData[]> {
        if (!this.options.ajax) {
            return []
        }

        const ajaxConfig = this.options.ajax

        // Check cache if enabled
        if (ajaxConfig.cache && this.ajaxCache.has(searchTerm)) {
            return this.ajaxCache.get(searchTerm)!
        }

        try {
            this.isLoading = true
            this.showLoadingState()

            // Prepare request data
            let requestData: Record<string, any> = {}
            if (ajaxConfig.data) {
                if (typeof ajaxConfig.data === 'function') {
                    requestData = ajaxConfig.data(searchTerm)
                } else {
                    requestData = {...ajaxConfig.data, q: searchTerm}
                }
            } else {
                requestData = {q: searchTerm}
            }

            // Prepare fetch options
            const fetchOptions: RequestInit = {
                method: ajaxConfig.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...ajaxConfig.headers
                }
            }

            let url = ajaxConfig.url

            if (fetchOptions.method === 'GET') {
                // For GET requests, append data as query parameters
                const params = new URLSearchParams(requestData).toString()
                url += (url.includes('?') ? '&' : '?') + params
            } else {
                // For POST requests, send data in body
                fetchOptions.body = JSON.stringify(requestData)
            }

            const response = await fetch(url, fetchOptions)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            // Process results
            let processedData: ExBoxOptionData[]
            if (ajaxConfig.processResults) {
                processedData = ajaxConfig.processResults(data)
            } else {
                // Default processing - assumes data is array of objects with value and label
                if (Array.isArray(data)) {
                    processedData = data.map(item => ({
                        value: item.value || item.id || '',
                        label: item.label || item.text || item.name || '',
                        additional: item.additional,
                        infos: item.infos
                    }))
                } else if (data.results && Array.isArray(data.results)) {
                    processedData = data.results.map(item => ({
                        value: item.value || item.id || '',
                        label: item.label || item.text || item.name || '',
                        additional: item.additional,
                        infos: item.infos
                    }))
                } else {
                    processedData = []
                }
            }

            // Cache results if enabled
            if (ajaxConfig.cache) {
                this.ajaxCache.set(searchTerm, processedData)
            }

            this.isLoading = false
            return processedData

        } catch (error) {
            console.error('AJAX request failed:', error)
            this.isLoading = false
            this.showErrorState()
            return []
        }
    }

    //endregion

    //region Handle Show Loading State
    protected showLoadingState() {
        const exBoxResultOptions = document.querySelector(`#ex-box-result-options-${this.randId}`)
        exBoxResultOptions.innerHTML = ''

        const loadingOption = document.createElement('li')
        loadingOption.classList.add('ex-box-result-options-select', 'loading-state')
        loadingOption.textContent = 'Loading...'
        exBoxResultOptions.appendChild(loadingOption)
    }

    //endregion

    //region Handle Show Error State
    protected showErrorState() {
        const exBoxResultOptions = document.querySelector(`#ex-box-result-options-${this.randId}`)
        exBoxResultOptions.innerHTML = ''

        const errorOption = document.createElement('li')
        errorOption.classList.add('ex-box-result-options-select', 'error-state')
        errorOption.textContent = 'Error loading data. Please try again.'
        exBoxResultOptions.appendChild(errorOption)
    }

    //endregion

    //region Handle Update Position
    protected updatePosition() {
        const inputPosition = this.exBox.getBoundingClientRect()
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth

        if (this.exBoxContainerResult) {
            // Set initial position
            this.exBoxContainerResult.style.top = `${inputPosition.bottom + scrollY - 3}px`
            this.exBoxContainerResult.style.left = `${inputPosition.left - 1}px`
            this.exBoxContainerResult.style.minWidth = `${inputPosition.width + 2}px`

            // Handle width settings
            if (this.options.autoWidth) {
                this.exBoxContainerResult.style.maxWidth = `${inputPosition.width + 2}px`
            } else if (this.options.maxWidth) {
                // Apply custom maxWidth
                this.exBoxContainerResult.style.maxWidth = typeof this.options.maxWidth === 'number'
                    ? `${this.options.maxWidth}px`
                    : this.options.maxWidth
            }

            this.exBoxContainerResult.style.zIndex = `9999`

            // Get position after initial setup
            const exBoxResultPosition = this.exBoxContainerResult.getBoundingClientRect()

            // Handle horizontal positioning (auto position if enabled)
            if (this.options.dropdownAutoPosition && Math.ceil(exBoxResultPosition.right) > windowWidth) {
                // Dropdown extends beyond right edge, position it to the left
                const newLeft = inputPosition.right - exBoxResultPosition.width + 1
                this.exBoxContainerResult.style.left = `${Math.max(10, newLeft)}px` // Ensure minimum 10px from left edge
            }

            // Handle vertical positioning
            if (Math.ceil(exBoxResultPosition.bottom) > windowHeight) {
                this.exBoxContainerResult.style.top = `${inputPosition.top - exBoxResultPosition.height + scrollY}px`

                if (this.exBoxContainerResult.classList.contains('on-bottom')) {
                    this.exBoxContainerResult.classList.remove('on-bottom')
                }
                this.exBoxContainerResult.classList.add('on-top')

                const inputParent = this.getElementParent(this.element) as HTMLElement
                if (inputParent) {
                    this.exBoxContainerResult.style.top = `${inputPosition.top - exBoxResultPosition.height + scrollY + 5}px`
                    this.exBoxContainerResult.style.zIndex = `9999`
                }

                // Re-check horizontal position after vertical adjustment
                if (this.options.dropdownAutoPosition) {
                    const updatedPosition = this.exBoxContainerResult.getBoundingClientRect()
                    if (Math.ceil(updatedPosition.right) > windowWidth) {
                        const newLeft = inputPosition.right - updatedPosition.width + 1
                        this.exBoxContainerResult.style.left = `${Math.max(10, newLeft)}px`
                    }
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
        // Clear timeout if exists
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
            this.searchTimeout = null
        }

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
        if (optionDatas && optionDatas.length !== 0) {
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

        // Don't allow clicking on loading, error, or placeholder states
        if (clickedOption.classList.contains('loading-state') ||
            clickedOption.classList.contains('error-state') ||
            clickedOption.classList.contains('loading-placeholder')) {
            return
        }

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

            // For AJAX, create option element if it doesn't exist
            let option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${optionValue}"]`)
            if (!option) {
                option = document.createElement('option')
                option.value = optionValue
                option.textContent = optionLabel
                this.element.appendChild(option)
            }

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
        const searchOption = document.querySelector(`#ex-box-search-field-${this.randId}`)
        searchOption.addEventListener('keyup', async (evt: KeyboardEvent) => {
            if (!inArray(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'], evt.key)) {
                const target = evt.target as HTMLInputElement
                const searchTerm = target.value

                // Clear previous timeout
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout)
                }

                if (this.options.ajax) {
                    // Handle AJAX search
                    const minimumLength = this.options.ajax.minimumInputLength || 0

                    if (searchTerm.length < minimumLength) {
                        this.showLoadingOrPlaceholder()
                        return
                    }

                    // Set delay for AJAX requests
                    const delay = this.options.ajax.delay || 300

                    this.searchTimeout = setTimeout(async () => {
                        const results = await this.performAjaxRequest(searchTerm)
                        this.createOptionSelect(results)
                        this.updatePosition()
                    }, delay)

                } else {
                    // Handle local search
                    const optionDatas = this.createOptionData()
                    const filtered = optionDatas.filter(element => {
                        for (const value of Object.values(element)) {
                            if (value) {
                                if (value.toString().toLowerCase().includes(searchTerm.toLowerCase())) return true;
                            }
                        }
                    })

                    this.createOptionSelect(filtered)
                    this.updatePosition()
                }
            } else {
                const optionItem: NodeListOf<HTMLElement> = document.querySelectorAll('.ex-box-result-options-select:not(.loading-state):not(.error-state):not(.loading-placeholder)')
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
        if (this.element instanceof HTMLSelectElement && elm.length > 0) {

            if (this.activeOption) {
                this.activeOption.classList.remove('selected')
            }

            elm[this.currentFocus].classList.add('selected')
            this.activeOption = elm[this.currentFocus]
            const optionValue = elm[this.currentFocus].getAttribute('data-value')
            const optionLabel = elm[this.currentFocus].textContent

            // For AJAX, create option element if it doesn't exist
            let option: HTMLOptionElement = this.element.querySelector(`#ex-box-select-${this.randId} option[value="${optionValue}"]`)
            if (!option) {
                option = document.createElement('option')
                option.value = optionValue
                option.textContent = optionLabel
                this.element.appendChild(option)
            }

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
        if (!elm || elm.length === 0) return false;
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

    //region Public method to clear cache
    public clearCache() {
        this.ajaxCache.clear()
    }

    //endregion

}
