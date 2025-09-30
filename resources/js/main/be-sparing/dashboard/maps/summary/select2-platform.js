export default class Select2Platform {
    constructor(selector, option) {
        this.lastQueryString = ''
        this.selector = typeof selector !== 'undefined' ? selector : ".select2-custom"
        this.option = {
            // dropdownAutoWidth: true,
            // width: '100%',
            matcher: matchCustom,
            templateResult: formatCustom,
            templateSelection: (state) => {
                const data_additional = $(state.element).attr('data-additional') || state.additional
                return `${state.text} ${typeof data_additional !== 'undefined' ? `/ ${data_additional}` : ''}`
            },
            language: {
                noResults: function(){
                    return "Oppss! Data tidak ditemukan!";
                },
                searching: function () {
                    return "Mohon Tunggu...";
                }
            },
            // dropdownParent: typeof dropdownParent !== 'undefined' ? dropdownParent : null,
            ...option,
        }
        this.sel = $(this.selector).select2(this.option).on('select2:open', function () {
            if (this.lastQueryString)
                $('.select2-search').find('input').focus().val(this.lastQueryString).trigger('input')
        }).on('select2:closing', function () {
            this.lastQueryString = $('.select2-search').find('input').val();
        }).on('select2:opening', function () {
            const dataDrop = $(this).data('select2').$dropdown.find('.select2-dropdown');
            dataDrop.css('z-index', 9999);
        }).on('select2:open', function () {
            $('.select2-search__field')[0].focus()
        })
    }

    setSelected(selector, value) {
        const select = typeof selector !== 'undefined' ? selector : this.selector
        $(select).val(value).trigger('change')
    }

    options(options) {
        return {
            ...options,
            ...this.option
        }
    }

    on(label, callback) {
        this.sel.on(label, callback)
    }

    off(label) {
        this.sel.off(label)
    }
}

function stringMatch(term, candidate) {
    return candidate && candidate.toLowerCase().indexOf(term.toLowerCase()) >= 0
}

function matchCustom(params, data) {
    if ($.trim(params.term) === '')
        return data

    if (typeof data.text === 'undefined')
        return null

    if (stringMatch(params.term, data.text))
        return data

    if (stringMatch(params.term, $(data.element).attr('data-additional') || data.additional))
        return data

    return null;
}

function formatCustom(state) {
    let additional_info = ''
    let is_bold = ''
    let statusPlatform = '<div class="ds-badge ds-badge-outline ds-badge-success !text-[12px]">Online</div>'
    if (typeof state.id !== 'undefined' && state.id !== '') {
        const data_additional = $(state.element).attr('data-additional') || state.additional
        const data_status = $(state.element).attr('data-status') || state.status
        const data_exclam = $(state.element).attr('data-exclam') || null
        if (typeof data_additional !== 'undefined') {
            const icon_exclam = data_exclam !== null ? '<i class="fas fa-exclamation-circle mr-1"></i>' : ''
            is_bold = 'font-bold'
            let additional = data_additional.split('#');
            additional_info = `<div class="truncate" style="font-size: 12px;"><i>${icon_exclam} ${additional[0]}</i></div>`
            if (additional.length > 0) {
                additional.forEach((value, index) => {
                    if (index !== 0) {
                        additional_info += `<div class="truncate" style="font-size: 12px;"><i>${value}</i></div>`
                    }
                })
            }
        }

        if (typeof data_status !== 'undefined') {
            if (data_status === 'offline') {
                statusPlatform = '<div class="ds-badge ds-badge-outline ds-badge-error !text-[12px]">Offline</div>'
            }
        }
    }

    let attr_disabled = $(state.element).attr('disabled')
    let is_disabled = ''
    if (typeof attr_disabled !== 'undefined')
        is_disabled = '#c2c2c2'

    let parent_state = `
        <div class="flex items-center justify-between">
            <div class="min-w-0">
                <div class="${is_bold}" style="font-size: 14px; color: ${is_disabled}">${state.text}</div>
                ${additional_info}
            </div>
            <div class="ml-1">
                ${statusPlatform}
            </div>
        </div>
    `

    return $(parent_state)
}

export const getSelect2DataAttributeFromAjax = (selector) => {
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").select2('data')[0] || {}
}

export const setTriggerSelected = (selector, val) => {
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").val(val).trigger('change')
}

export const setSelect2Enable = (selector, val) => {
    return $(typeof selector !== 'undefined' ? selector : ".select2-custom").select2("enable", val)
}
