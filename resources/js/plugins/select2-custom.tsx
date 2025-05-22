export default class Select2Custom {
    selector: any
    option: any
    selection: any

    constructor(selector?: any, option?: any) {
        let lastQueryString = ''
        this.selector = typeof selector !== 'undefined' ? selector : '.select2-custom'
        this.option = {
            dropdownAutoWidth: true,
            width: '100%',
            matcher: matchCustom,
            templateResult: formatCustom,
            templateSelection: (state: any) => {
                const data_additional = $(state.element).attr('data-additional') || state.additional
                return `${state.text} ${typeof data_additional !== 'undefined' ? `/ ${data_additional}` : ''}`
            },
            language: {
                noResults: function () {
                    return "Oppss! Data tidak ditemukan!";
                },
                searching: function () {
                    return "Mohon Tunggu...";
                }
            },
            // dropdownParent: typeof dropdownParent !== 'undefined' ? dropdownParent : null,
            ...option,
        }

        // @ts-ignore
        this.selection = $(this.selector).select2(this.option)
        this.selection.on('select2:open', function () {
            $('.select2-container--open .select2-search__field').focus()
            if (lastQueryString) {
                document.querySelectorAll('.select2-search__field').forEach((elm: HTMLInputElement) => {
                    elm.value = lastQueryString
                    const event = new Event('input', {
                        bubbles: true,
                    });

                    elm.dispatchEvent(event)
                })
            }

            const parentContainer = $(this).data('select2').$dropdown
            const dataDrop = $(parentContainer).find('.select2-dropdown')
            const dataDropMinWidth = dataDrop.width() + 2
            const offset = parentContainer.offset()
            setTimeout(() => {
                parentContainer.css({
                    'position': 'absolute',
                    'left': `${offset.left - 1}px`,
                    'top': `${offset.top - 2}px`,
                })

                dataDrop.css({
                    'min-width': `${dataDropMinWidth + 2}px`
                })
            }, 1)
        })
        this.selection.on('select2:closing', function () {
            lastQueryString = $('.select2-search').find('input').val();
        })
        this.selection.on('select2:opening', function () {
            const dataDrop = $(this).data('select2').$dropdown.find('.select2-dropdown')
            dataDrop.css('z-index', 9999)
        })
    }

    setSelected(selector: any, value: string | number) {
        const select = typeof selector !== 'undefined' ? selector : this.selector
        $(select).val(value).trigger('change')
    }

    options(options: any) {
        return {
            ...options,
            ...this.option
        }
    }

    on(label: string, callback: (...args: any) => void) {
        this.selection.on(label, callback)
    }

    off(label: string) {
        this.selection.off(label)
    }
}

function matchCustom(params: any, data: any) {
    if ($.trim(params.term) === '') {
        return data
    }

    if (typeof data.text === 'undefined')
        return null

    if (stringMatch(params?.term, data.text))
        return data

    if (stringMatch(params.term, $(data.element).attr('data-additional') || data.additional))
        return data

    return null;
}

function stringMatch(term: string, candidate: string) {
    return candidate && candidate.toLowerCase().indexOf(term.toLowerCase()) >= 0
}

function formatCustom(state: any) {
    let additional_info = ''
    let is_bold = ''
    const data_marginLeft = $(state.element).attr('data-marginLeft') || '0'
    if (typeof state.id !== 'undefined' && state.id !== '') {
        const data_additional = $(state.element).attr('data-additional') || state.additional
        const data_exclam = $(state.element).attr('data-exclam') || null
        if (typeof data_additional !== 'undefined') {
            const icon_exclam = data_exclam !== null ? '<i class="fas fa-exclamation-circle mr-1"></i>' : ''
            is_bold = 'font-bold'
            let additional = data_additional.split('#');
            additional_info = `<div style="font-size: 12px; margin-left: ${data_marginLeft};"><i>${icon_exclam} ${additional[0]}</i></div>`
            if (additional.length > 0) {
                additional.forEach((value: string, index: number) => {
                    if (index !== 0) {
                        additional_info += `<div style="font-size: 12px; margin-left: ${data_marginLeft};"><i>${value}</i></div>`
                    }
                })
            }
        }
    }

    let attr_disabled = $(state.element).attr('disabled')
    let is_disabled = 'font-size: 14px;'
    if (typeof attr_disabled !== 'undefined')
        is_disabled = 'font-size: 14px; color: #c2c2c2;'

    let parent_state = `<div class="${is_bold}" style="${is_disabled} margin-left: ${data_marginLeft};">${state.text}</div>`

    parent_state += additional_info
    return $(parent_state)
}

export const getSelect2DataAttributeFromAjax = (selector: string) => {
    // @ts-ignore
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").select2('data')[0] || {}
}

export const setTriggerSelected = (selector: any, val: string) => {
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").val(val).trigger('change')
}

export const setSelect2Enable = (selector: string, val: boolean) => {
    // @ts-ignore
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").select2("enable", val)
}
