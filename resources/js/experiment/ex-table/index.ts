const tableDiv = document.querySelector('.table-div')
const tableHeaderRow = tableDiv.querySelectorAll('.row')
const iCells = []
tableHeaderRow.forEach((elm, iElm) => {
    elm.setAttribute('data-i', `${iElm}`)
    const tableCell = elm.querySelectorAll('.cell')
    tableCell.forEach((elmCell, iEmlCell) => {
        elmCell.setAttribute('data-i-cell', `${iEmlCell}`)
        const attrW = elmCell.getAttribute('data-w')
        if (attrW) {
            iCells.push({
                index: iEmlCell,
                style: `flex: none; width: ${attrW}px;`
            })

            elmCell.setAttribute('style', `flex: none; width: ${attrW}px;`)
        } else {
            iCells.push({
                index: iEmlCell,
                style: `flex: 1;`
            })

            elmCell.setAttribute('style', `flex: 1;`)
        }
    })
})

const tableBodyRow = tableDiv.querySelectorAll('.body .row')
tableBodyRow.forEach((elm, iElm) => {
    const tableCell = elm.querySelectorAll('.cell')
    tableCell.forEach((elmCell, iEmlCell) => {
        const attrIndex = elmCell.getAttribute('data-i-cell')
        const item = iCells.find(i => i.index === parseInt(attrIndex))
        if (item) {
            elmCell.setAttribute('style', `${item.style}`)
        }
    })
})
