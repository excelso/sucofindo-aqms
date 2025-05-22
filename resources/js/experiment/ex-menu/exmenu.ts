import {ExMenuInterfaces} from "@/js/experiment/ex-menu/interfaces";

export class ExMenu {

    protected element: Element|HTMLElement
    protected options: ExMenuInterfaces = {
        trigger: null
    }

    constructor(element: Element|HTMLElement, options?: ExMenuInterfaces) {
        this.element = element
        this.options = {
            ...this.options,
            ...options
        }

        this.renderMenu()
    }

    private renderMenu() {
        if (this.element) {
            this.element.classList.add('ex-menu')
            const exMenuTrigger = this.element.querySelectorAll('.ex-menu-arrow')
            exMenuTrigger.forEach((elm) => {
                elm.addEventListener('click', function () {
                    const listItemLi = this.closest('li')
                    const listItemUl: HTMLElement = listItemLi.querySelector('ul')

                    if (listItemUl.classList.contains('ex-menu-show')) {
                        // Collapse
                        const currentHeight = listItemUl.scrollHeight
                        listItemUl.style.height = `${currentHeight}px`
                        listItemUl.classList.add('ex-menu-collapsing')

                        setTimeout(() => {
                            listItemUl.style.height = '0'
                        }, 10) // Kecil delay untuk memastikan height awal telah diatur

                        listItemUl.addEventListener('transitionend', function collapseEnd() {
                            listItemUl.classList.remove('ex-menu-show', 'ex-menu-collapsing')
                            listItemUl.style.removeProperty('height')
                            listItemUl.removeEventListener('transitionend', collapseEnd)
                        }, {once: false})
                    } else {
                        // Expand
                        listItemUl.classList.add('ex-menu-collapsing', 'ex-menu-show')
                        const ulHeight = listItemUl.scrollHeight
                        listItemUl.style.height = '0'

                        setTimeout(() => {
                            listItemUl.style.height = `${ulHeight}px`
                        }, 10)

                        listItemUl.addEventListener('transitionend', function expandEnd() {
                            listItemUl.classList.remove('ex-menu-collapsing')
                            listItemUl.style.removeProperty('height')
                            listItemUl.removeEventListener('transitionend', expandEnd)
                        }, {once: false})
                    }
                })
            })
        }
    }

    public collapse() {
        const exMenuTrigger = this.element.querySelectorAll('.ex-menu-arrow')
        exMenuTrigger.forEach((elm: HTMLElement) => {
            const listItemLi = elm.closest('li')
            const listItemUl: HTMLElement = listItemLi.querySelector('ul')

            if (listItemUl.classList.contains('ex-menu-show')) {
                // Collapse
                const currentHeight = listItemUl.scrollHeight
                listItemUl.style.height = `${currentHeight}px`
                listItemUl.classList.add('ex-menu-collapsing')

                listItemUl.classList.remove('ex-menu-show', 'ex-menu-collapsing')
                listItemUl.style.removeProperty('height')
            }
        })
    }

}
