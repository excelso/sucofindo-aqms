import {ExMenu} from "@/js/experiment/ex-menu";

document.addEventListener('DOMContentLoaded', function () {
    const exMenuElm = document.querySelector('.ex-menu')

    new ExMenu(exMenuElm)

    // const exMenuItemElm = exMenuElm.querySelectorAll('.ex-menu-item ul.ex-menu-tree')
    //
    // const exMenuArrow = document.querySelectorAll('.ex-menu-arrow')
    // exMenuArrow.forEach((elm) => {
    //     elm.addEventListener('click', function () {
    //         const listItemLi = this.closest('li')
    //         const listItemUl: HTMLElement = listItemLi.querySelector('ul')
    //
    //         if (listItemUl.classList.contains('ex-menu-show')) {
    //             // Collapse
    //             const currentHeight = listItemUl.scrollHeight
    //             listItemUl.style.height = `${currentHeight}px`
    //             listItemUl.classList.add('ex-menu-collapsing')
    //
    //             setTimeout(() => {
    //                 listItemUl.style.height = '0'
    //             }, 10) // Kecil delay untuk memastikan height awal telah diatur
    //
    //             listItemUl.addEventListener('transitionend', function collapseEnd() {
    //                 listItemUl.classList.remove('ex-menu-show', 'ex-menu-collapsing')
    //                 listItemUl.style.removeProperty('height')
    //                 listItemUl.removeEventListener('transitionend', collapseEnd)
    //             }, { once: true })
    //         } else {
    //             // Expand
    //             listItemUl.classList.add('ex-menu-collapsing', 'ex-menu-show')
    //             const ulHeight = listItemUl.scrollHeight
    //             listItemUl.style.height = '0'
    //
    //             setTimeout(() => {
    //                 listItemUl.style.height = `${ulHeight}px`
    //             }, 10)
    //
    //             listItemUl.addEventListener('transitionend', function expandEnd() {
    //                 listItemUl.classList.remove('ex-menu-collapsing')
    //                 listItemUl.style.removeProperty('height')
    //                 listItemUl.removeEventListener('transitionend', expandEnd)
    //             }, { once: true })
    //         }
    //
    //     })
    // })

    const checkbox = document.querySelectorAll('.ex-menu-item input[type="checkbox"]')
    checkbox.forEach((checkbox: HTMLInputElement) => {
        checkbox.addEventListener('change', () => {
            // Handle child checkboxes when a parent checkbox is changed
            handleChildCheckboxes(checkbox);
            handleParentCheckboxes(checkbox);
        });
    })

    function handleChildCheckboxes(parentCheckbox: HTMLInputElement) {
        const parentItem = parentCheckbox.closest('.ex-menu-item');
        if (parentItem) {
            const childCheckboxes = parentItem.querySelectorAll('.ex-menu-tree input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
            childCheckboxes.forEach(child => {
                child.checked = parentCheckbox.checked;
                child.indeterminate = false;
            });
        }
    }

    function handleParentCheckboxes(childCheckbox: HTMLInputElement) {
        let parentItem = childCheckbox.closest('.ex-menu-tree');
        while (parentItem) {
            const parentCheckbox = parentItem.previousElementSibling?.querySelector('input[type="checkbox"]') as HTMLInputElement;
            const siblingCheckboxes = parentItem.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

            if (parentCheckbox) {
                const allChecked = Array.from(siblingCheckboxes).every(cb => cb.checked);
                const someChecked = Array.from(siblingCheckboxes).some(cb => cb.checked);

                parentCheckbox.checked = allChecked;
                parentCheckbox.indeterminate = !allChecked && someChecked;

                parentItem = parentCheckbox.closest('.ex-menu-tree');
            } else {
                break;
            }
        }
    }

})
