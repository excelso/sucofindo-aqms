import {failureAlert} from "@/js/plugins/sweet-alert";
import {ExDOMHelper} from "@/js/experiment/ex-dom-helper";

export const ExSort = (exOptions: {
    url: URL,
    win: Window,
    bodySorting: HTMLElement,
    btnApplySort: HTMLElement,
    btnResetSort: HTMLElement,
    btnAddSort: HTMLElement
}) => {

    const exDom = ExDOMHelper

    const dataSort = document.querySelectorAll('th[data-sort]')
    const dataColumns = [{value: '', label: '...'}]
    dataSort.forEach((elm) => {
        const column = elm.getAttribute('data-sort')
        const columnLabel = elm.textContent
        dataColumns.push({value: column, label: columnLabel})
    })

    const dataSortDirection = [{value: '', label: '...'}, {value: 'asc', label: 'Asc'}, {
        value: 'desc',
        label: 'Desc'
    }]

    function renderSortRow(options: {
        labelFirstRow: string,
        isFirstRow: boolean,
        actionDelete?: boolean,
        sortColumnSelected?: string,
        sortDirectionSelected?: string,
    }) {
        const elmTr = document.createElement('tr')
        elmTr.classList.add('sort-row')

        //region 1st Column
        const elmTdLabel = document.createElement('td')
        elmTdLabel.classList.add('text-left')
        elmTdLabel.classList.add('sortLabel')
        elmTdLabel.textContent = options.labelFirstRow
        //endregion

        //region 2nd Column
        const elmTdColumn = document.createElement('td')
        elmTdColumn.classList.add('text-left')
        const elmTdSortColumnSelect = document.createElement('select')
        elmTdSortColumnSelect.classList.add('select-sort')
        elmTdSortColumnSelect.classList.add('w-full', 'pl-0', 'pt-0', 'pb-0', 'border-0', 'focus:ring-0', 'text-[14px]')
        elmTdSortColumnSelect.classList.add('sortColumn')

        dataColumns.forEach((item) => {
            const elmTdColumnOption = document.createElement('option')
            elmTdColumnOption.value = item.value
            elmTdColumnOption.textContent = item.label
            elmTdColumnOption.selected = item.value === options.sortColumnSelected
            elmTdSortColumnSelect.appendChild(elmTdColumnOption)
        })

        elmTdColumn.appendChild(elmTdSortColumnSelect)
        //endregion

        //region 3rd Column
        const elmTdSortAs = document.createElement('td')
        elmTdSortAs.classList.add('text-left')
        const elmTdSortDirectionSelect = document.createElement('select')
        elmTdSortDirectionSelect.classList.add('select-sort')
        elmTdSortDirectionSelect.classList.add('w-full', 'pl-0', 'pt-0', 'pb-0', 'border-0', 'focus:ring-0', 'text-[14px]')
        elmTdSortDirectionSelect.classList.add('sortDirection')

        dataSortDirection.forEach((item) => {
            const elmTdSortDirectionOption = document.createElement('option')
            elmTdSortDirectionOption.value = item.value
            elmTdSortDirectionOption.textContent = item.label
            elmTdSortDirectionOption.selected = item.value === options.sortDirectionSelected
            elmTdSortDirectionSelect.appendChild(elmTdSortDirectionOption)
        })

        elmTdSortAs.appendChild(elmTdSortDirectionSelect)
        //endregion

        //region 4th Column
        const elmTdActionDelete = document.createElement('td')
        elmTdActionDelete.classList.add('text-center')
        if (!options.actionDelete) {
            elmTdActionDelete.textContent = '-'
        } else {
            const elmTdBtnDelete = document.createElement('a')
            elmTdBtnDelete.classList.add('btnDelete')
            const elmTdBtnDeleteIcon = document.createElement('i')
            elmTdBtnDeleteIcon.classList.add('fas')
            elmTdBtnDeleteIcon.classList.add('fa-trash-can')
            elmTdBtnDelete.appendChild(elmTdBtnDeleteIcon)
            elmTdBtnDelete.addEventListener('click', () => handleAction(elmTr))
            elmTdActionDelete.appendChild(elmTdBtnDelete)
        }
        //endregion

        //region Append to Table Body
        elmTr.appendChild(elmTdLabel)
        elmTr.appendChild(elmTdColumn)
        elmTr.appendChild(elmTdSortAs)
        elmTr.appendChild(elmTdActionDelete)

        exOptions.bodySorting.appendChild(elmTr)
        //endregion
    }

    function handleAction(elmTr: HTMLElement) {
        const rowSort: NodeListOf<Element> = exOptions.bodySorting.querySelectorAll('.sort-row')
        if (rowSort.length > 1) {
            elmTr.remove()
        } else {
            const sortColumn: HTMLInputElement = elmTr.querySelector('.sortColumn')
            const sortDirection: HTMLInputElement = elmTr.querySelector('.sortDirection')

            sortColumn.value = ''
            sortDirection.value = ''
        }

        handleLastRows()
    }

    function handleLastRows() {
        const rowSort: NodeListOf<Element> = exOptions.bodySorting.querySelectorAll('.sort-row')
        rowSort.forEach((elm, key) => {
            const sortLabel = elm.querySelector('.sortLabel')
            if (key === 0) {
                sortLabel.textContent = 'Sort By'
            }
        })
    }

    function renderExistSort() {
        exOptions.bodySorting.innerHTML = ''
        const existUrlSortParam = exOptions.url.searchParams.get('sort')
        if (existUrlSortParam) {
            const existParams = existUrlSortParam.split(',')
            existParams.forEach((item, index) => {
                const dataSort = item.split('|')
                if (index !== 0) {
                    renderSortRow({
                        labelFirstRow: 'Then',
                        isFirstRow: false,
                        actionDelete: true,
                        sortColumnSelected: dataSort[0],
                        sortDirectionSelected: dataSort[1],
                    })
                } else {
                    renderSortRow({
                        labelFirstRow: 'Sort By',
                        isFirstRow: false,
                        actionDelete: true,
                        sortColumnSelected: dataSort[0],
                        sortDirectionSelected: dataSort[1]
                    })
                }
            })
        } else {
            renderSortRow({
                labelFirstRow: 'Sort By',
                isFirstRow: true,
                actionDelete: true,
            })
        }
    }

    function applySort() {
        if (exOptions.btnAddSort) {
            new exDom(exOptions.btnAddSort).off('click').on('click', function () {
                renderSortRow({
                    labelFirstRow: 'Then',
                    isFirstRow: false,
                    actionDelete: true
                })
            })
        }

        if (exOptions.btnApplySort) {
            exOptions.btnApplySort.addEventListener('click', function () {
                const elmSort = exOptions.bodySorting.querySelectorAll('tr.sort-row')
                const dataToSorts = []
                const dataColumns = []
                elmSort.forEach((elm) => {
                    const sortColumn: HTMLInputElement = elm.querySelector('.sortColumn')
                    const sortDirection: HTMLInputElement = elm.querySelector('.sortDirection')
                    if (sortColumn.value !== '' && sortDirection.value !== '') {
                        dataColumns.push(`${sortColumn.value}`)
                        dataToSorts.push(`${sortColumn.value}|${sortDirection.value}`)
                    }
                })

                if (dataToSorts.length !== 0) {
                    if (checkIfDuplicateExists(dataColumns)) {
                        failureAlert({
                            html: 'Columns cannot be Equal'
                        })
                    } else {
                        exOptions.url.searchParams.set('sort', dataToSorts.join(','))
                        exOptions.win.location = exOptions.url.toString()
                    }
                } else {
                    const urlParams = new URLSearchParams(exOptions.url.searchParams)
                    if (urlParams.size !== 0) {
                        [...urlParams.keys()].forEach((item) => {
                            if (item === 'sort') {
                                exOptions.url.searchParams.delete(item)
                            }
                        })

                        exOptions.win.location = exOptions.url.toString()
                    }
                }
            })
        }

        if (exOptions.btnResetSort) {
            exOptions.btnResetSort.addEventListener('click', function () {
                exOptions.url.searchParams.delete('sort')
                exOptions.win.location = exOptions.url.toString()
            })
        }
    }

    function checkIfDuplicateExists(arr: any[]) {
        return new Set(arr).size !== arr.length
    }

    return {
        renderSortRow,
        renderExistSort,
        applySort
    }

}
