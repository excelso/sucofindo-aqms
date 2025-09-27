import {
    compareArrays, fileUrlToFile, formatBytes,
    getFileBase64,
    getMetaContent,
    hiddenElm,
    responseMessages,
    showHiddenElmAndText
} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {Loader} from "@googlemaps/js-api-loader";
import {Tabs} from "flowbite";
import type {TabItem, TabsOptions} from 'flowbite';
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";
import DataSiteModel from "@/js/main/be-sparing/master/data-site/model/DataSiteModel";

document.addEventListener('DOMContentLoaded', function () {

    //region Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const dataTables: NodeListOf<Element> = document.querySelectorAll('.data-tables')
    const closeModalForm: NodeListOf<Element> = document.querySelectorAll('.closeModalForm')

    const btnTambah: Element = document.querySelector('.btnTambah')
    const modalForm: Element = document.querySelector('.modalForm')
    const customerId: HTMLInputElement = modalForm.querySelector('.customerId')
    const customerIdError: Element = modalForm.querySelector('.customerIdError')
    const customerLokasiId: HTMLSelectElement = modalForm.querySelector('.customerLokasiId')
    const customerLokasiIdError: Element = modalForm.querySelector('.customerLokasiIdError')
    const siteIdOld: HTMLInputElement = modalForm.querySelector('.siteIdOld')
    const siteId: HTMLSelectElement = modalForm.querySelector('.siteId')
    const siteIdError: Element = modalForm.querySelector('.siteIdError')
    const tipeLogger: HTMLInputElement = modalForm.querySelector('.tipeLogger')
    const tipeLoggerError: Element = modalForm.querySelector('.tipeLoggerError')
    const platformUidOld: HTMLInputElement = modalForm.querySelector('.platformUidOld')
    const platformUid: HTMLInputElement = modalForm.querySelector('.platformUid')
    const platformUidError: Element = modalForm.querySelector('.platformUidError')
    const catchmentArea: HTMLInputElement = modalForm.querySelector('.catchmentArea')
    const catchmentAreaError: Element = modalForm.querySelector('.catchmentAreaError')
    const badanAir: HTMLInputElement = modalForm.querySelector('.badanAir')
    const badanAirError: Element = modalForm.querySelector('.badanAirError')
    const serialNumber: HTMLInputElement = modalForm.querySelector('.serialNumber')
    const serialNumberError: Element = modalForm.querySelector('.serialNumberError')
    const lokasiPlatform: HTMLInputElement = modalForm.querySelector('.lokasiPlatform')
    const lokasiPlatformError: Element = modalForm.querySelector('.lokasiPlatformError')
    const alamatLokasiPlatform: HTMLInputElement = modalForm.querySelector('.alamatLokasiPlatform')
    const btnLihatMaps: Element = modalForm.querySelector('.btnLihatMaps')
    const nomorModem: HTMLInputElement = modalForm.querySelector('.nomorModem')
    const tanggalIsiModem: HTMLInputElement = modalForm.querySelector('.tanggalIsiModem')
    const formParamPh: Element = modalForm.querySelector('.formParamPh')
    const phMutuMin: HTMLInputElement = modalForm.querySelector('.phMutuMin')
    const phMutuMinError: Element = modalForm.querySelector('.phMutuMinError')
    const phWarnMin: HTMLInputElement = modalForm.querySelector('.phWarnMin')
    const phWarnMinError: Element = modalForm.querySelector('.phWarnMinError')
    const phMutuMax: HTMLInputElement = modalForm.querySelector('.phMutuMax')
    const phMutuMaxError: Element = modalForm.querySelector('.phMutuMaxError')
    const phWarnMax: HTMLInputElement = modalForm.querySelector('.phWarnMax')
    const phWarnMaxError: Element = modalForm.querySelector('.phWarnMaxError')
    const intermitPh: HTMLInputElement = modalForm.querySelector('.intermitPh')
    const formParamCod: Element = modalForm.querySelector('.formParamCod')
    const codLowMutu: HTMLInputElement = modalForm.querySelector('.codLowMutu')
    const codLowMutuError: Element = modalForm.querySelector('.codLowMutuError')
    const codLowWarn: HTMLInputElement = modalForm.querySelector('.codLowWarn')
    const codLowWarnError: Element = modalForm.querySelector('.codLowWarnError')
    const codHighWarn: HTMLInputElement = modalForm.querySelector('.codHighWarn')
    const codHighWarnError: Element = modalForm.querySelector('.codHighWarnError')
    const codHighMutu: HTMLInputElement = modalForm.querySelector('.codHighMutu')
    const codHighMutuError: Element = modalForm.querySelector('.codHighMutuError')
    const intermitCod: HTMLInputElement = modalForm.querySelector('.intermitCod')
    const formParamTss: Element = modalForm.querySelector('.formParamTss')
    const tssLowMutu: HTMLInputElement = modalForm.querySelector('.tssLowMutu')
    const tssLowMutuError: Element = modalForm.querySelector('.tssLowMutuError')
    const tssLowWarn: HTMLInputElement = modalForm.querySelector('.tssLowWarn')
    const tssLowWarnError: Element = modalForm.querySelector('.tssLowWarnError')
    const tssHighMutu: HTMLInputElement = modalForm.querySelector('.tssHighMutu')
    const tssHighMutuError: Element = modalForm.querySelector('.tssHighMutuError')
    const tssHighWarn: HTMLInputElement = modalForm.querySelector('.tssHighWarn')
    const tssHighWarnError: Element = modalForm.querySelector('.tssHighWarnError')
    const intermitTss: HTMLInputElement = modalForm.querySelector('.intermitTss')
    const formParamNh3n: Element = modalForm.querySelector('.formParamNh3n')
    const nh3nLowMutu: HTMLInputElement = modalForm.querySelector('.nh3nLowMutu')
    const nh3nLowMutuError: Element = modalForm.querySelector('.nh3nLowMutuError')
    const nh3nLowWarn: HTMLInputElement = modalForm.querySelector('.nh3nLowWarn')
    const nh3nLowWarnError: Element = modalForm.querySelector('.nh3nLowWarnError')
    const nh3nHighMutu: HTMLInputElement = modalForm.querySelector('.nh3nHighMutu')
    const nh3nHighMutuError: Element = modalForm.querySelector('.nh3nHighMutuError')
    const nh3nHighWarn: HTMLInputElement = modalForm.querySelector('.nh3nHighWarn')
    const nh3nHighWarnError: Element = modalForm.querySelector('.nh3nHighWarnError')
    const intermitNh3n: HTMLInputElement = modalForm.querySelector('.intermitNh3n')
    const formParamDebit: Element = modalForm.querySelector('.formParamDebit')
    const debitLowMutu: HTMLInputElement = modalForm.querySelector('.debitLowMutu')
    const debitLowMutuError: Element = modalForm.querySelector('.debitLowMutuError')
    const debitLowWarn: HTMLInputElement = modalForm.querySelector('.debitLowWarn')
    const debitLowWarnError: Element = modalForm.querySelector('.debitLowWarnError')
    const debitHighMutu: HTMLInputElement = modalForm.querySelector('.debitHighMutu')
    const debitHighMutuError: Element = modalForm.querySelector('.debitHighMutuError')
    const debitHighWarn: HTMLInputElement = modalForm.querySelector('.debitHighWarn')
    const debitHighWarnError: Element = modalForm.querySelector('.debitHighWarnError')
    const intermitDebit: HTMLInputElement = modalForm.querySelector('.intermitDebit')

    const isTipeMonitor: HTMLInputElement = document.querySelector('.isTipeMonitor')
    const formReParamPh: HTMLElement = document.querySelector('.formReParamPh')
    const phReSensorMin: HTMLInputElement = document.querySelector('.phReSensorMin')
    const phReSensorMinError: HTMLElement = document.querySelector('.phReSensorMinError')
    const phReSensorMax: HTMLInputElement = document.querySelector('.phReSensorMax')
    const phReSensorMaxError: HTMLElement = document.querySelector('.phReSensorMaxError')
    const phReMutuMin: HTMLInputElement = document.querySelector('.phReMutuMin')
    const phReMutuMinError: HTMLElement = document.querySelector('.phReMutuMinError')
    const phReWarnMin: HTMLInputElement = document.querySelector('.phReWarnMin')
    const phReWarnMinError: HTMLElement = document.querySelector('.phReWarnMinError')
    const phReWarnMax: HTMLInputElement = document.querySelector('.phReWarnMax')
    const phReWarnMaxError: HTMLElement = document.querySelector('.phReWarnMaxError')
    const phReMutuMax: HTMLInputElement = document.querySelector('.phReMutuMax')
    const phReMutuMaxError: HTMLElement = document.querySelector('.phReMutuMaxError')

    const formReParamCod: HTMLElement = document.querySelector('.formReParamCod')
    const codReSensorMin: HTMLInputElement = document.querySelector('.codReSensorMin')
    const codReSensorMinError: HTMLElement = document.querySelector('.codReSensorMinError')
    const codReSensorMax: HTMLInputElement = document.querySelector('.codReSensorMax')
    const codReSensorMaxError: HTMLElement = document.querySelector('.codReSensorMaxError')
    const codReMutuMin: HTMLInputElement = document.querySelector('.codReMutuMin')
    const codReMutuMinError: HTMLElement = document.querySelector('.codReMutuMinError')
    const codReWarnMin: HTMLInputElement = document.querySelector('.codReWarnMin')
    const codReWarnMinError: HTMLElement = document.querySelector('.codReWarnMinError')
    const codReWarnMax: HTMLInputElement = document.querySelector('.codReWarnMax')
    const codReWarnMaxError: HTMLElement = document.querySelector('.codReWarnMaxError')
    const codReMutuMax: HTMLInputElement = document.querySelector('.codReMutuMax')
    const codReMutuMaxError: HTMLElement = document.querySelector('.codReMutuMaxError')

    const formReParamTss: HTMLElement = document.querySelector('.formReParamTss')
    const tssReSensorMin: HTMLInputElement = document.querySelector('.tssReSensorMin')
    const tssReSensorMinError: HTMLElement = document.querySelector('.tssReSensorMinError')
    const tssReSensorMax: HTMLInputElement = document.querySelector('.tssReSensorMax')
    const tssReSensorMaxError: HTMLElement = document.querySelector('.tssReSensorMaxError')
    const tssReMutuMin: HTMLInputElement = document.querySelector('.tssReMutuMin')
    const tssReMutuMinError: HTMLElement = document.querySelector('.tssReMutuMinError')
    const tssReWarnMin: HTMLInputElement = document.querySelector('.tssReWarnMin')
    const tssReWarnMinError: HTMLElement = document.querySelector('.tssReWarnMinError')
    const tssReWarnMax: HTMLInputElement = document.querySelector('.tssReWarnMax')
    const tssReWarnMaxError: HTMLElement = document.querySelector('.tssReWarnMaxError')
    const tssReMutuMax: HTMLInputElement = document.querySelector('.tssReMutuMax')
    const tssReMutuMaxError: HTMLElement = document.querySelector('.tssReMutuMaxError')

    const formReParamNh3n: HTMLElement = document.querySelector('.formReParamNh3n')
    const nh3nReSensorMin: HTMLInputElement = document.querySelector('.nh3nReSensorMin')
    const nh3nReSensorMinError: HTMLElement = document.querySelector('.nh3nReSensorMinError')
    const nh3nReSensorMax: HTMLInputElement = document.querySelector('.nh3nReSensorMax')
    const nh3nReSensorMaxError: HTMLElement = document.querySelector('.nh3nReSensorMaxError')
    const nh3nReMutuMin: HTMLInputElement = document.querySelector('.nh3nReMutuMin')
    const nh3nReMutuMinError: HTMLElement = document.querySelector('.nh3nReMutuMinError')
    const nh3nReWarnMin: HTMLInputElement = document.querySelector('.nh3nReWarnMin')
    const nh3nReWarnMinError: HTMLElement = document.querySelector('.nh3nReWarnMinError')
    const nh3nReWarnMax: HTMLInputElement = document.querySelector('.nh3nReWarnMax')
    const nh3nReWarnMaxError: HTMLElement = document.querySelector('.nh3nReWarnMaxError')
    const nh3nReMutuMax: HTMLInputElement = document.querySelector('.nh3nReMutuMax')
    const nh3nReMutuMaxError: HTMLElement = document.querySelector('.nh3nReMutuMaxError')

    const formReParamDebit: HTMLElement = document.querySelector('.formReParamDebit')
    const debitReSensorMin: HTMLInputElement = document.querySelector('.debitReSensorMin')
    const debitReSensorMinError: HTMLElement = document.querySelector('.debitReSensorMinError')
    const debitReSensorMax: HTMLInputElement = document.querySelector('.debitReSensorMax')
    const debitReSensorMaxError: HTMLElement = document.querySelector('.debitReSensorMaxError')
    const debitReMutuMin: HTMLInputElement = document.querySelector('.debitReMutuMin')
    const debitReMutuMinError: HTMLElement = document.querySelector('.debitReMutuMinError')
    const debitReWarnMin: HTMLInputElement = document.querySelector('.debitReWarnMin')
    const debitReWarnMinError: HTMLElement = document.querySelector('.debitReWarnMinError')
    const debitReWarnMax: HTMLInputElement = document.querySelector('.debitReWarnMax')
    const debitReWarnMaxError: HTMLElement = document.querySelector('.debitReWarnMaxError')
    const debitReMutuMax: HTMLInputElement = document.querySelector('.debitReMutuMax')
    const debitReMutuMaxError: HTMLElement = document.querySelector('.debitReMutuMaxError')

    const btnTambahDokumen: Element = modalForm.querySelector('.btnTambahDokumen')
    const tBodyDokumen: Element = modalForm.querySelector('.tBodyDokumen')
    const noDokumen: Element = modalForm.querySelector('.noDokumen')
    const btnSimpan: Element = modalForm.querySelector('.btnSimpan')
    const btnHapus: Element = modalForm.querySelector('.btnHapus')
    const btnMonitor: Element = modalForm.querySelector('.btnMonitor')

    const btnPencarian: Element = document.querySelector('.btnPencarian')
    const modalPencarian: HTMLInputElement = document.querySelector('.modalPencarian')
    const modalFormMaps = document.querySelector('.modalFormMaps')
    const modalUpload = document.querySelector('.modalUpload')
    const closeModalUpload = document.querySelector('.closeModalUpload')
    const btnSimpanUpload = modalUpload.querySelector('.btnSimpanUpload')
    const namaDokumen: HTMLInputElement = modalUpload.querySelector('.namaDokumen')
    const namaDokumenError = modalUpload.querySelector('.namaDokumenError')
    const fileDokumen: HTMLInputElement = modalUpload.querySelector('.fileDokumen')
    const fileDokumenName: HTMLInputElement = modalUpload.querySelector('.fileDokumenName')
    const fileDokumenBase64: HTMLInputElement = modalUpload.querySelector('.fileDokumenBase64')
    const fileDokumenMimeType: HTMLInputElement = modalUpload.querySelector('.fileDokumenMimeType')
    const fileDokumenSize: HTMLInputElement = modalUpload.querySelector('.fileDokumenSize')
    const fileDokumenUrl: HTMLInputElement = modalUpload.querySelector('.fileDokumenUrl')
    const fileDokumenError = modalUpload.querySelector('.fileDokumenError')
    //endregion

    //region Handle Tabs
    const roleExTabs: HTMLElement = document.querySelector('[data-role="exTabs"]')
    const roleExTabsChilds = roleExTabs.querySelectorAll('li')
    const tabsElms: TabItem[] = []
    roleExTabsChilds.forEach((elm) => {
        const triggerLinks = elm.querySelectorAll('[data-tabs-target]')
        triggerLinks.forEach((elmTrigger: HTMLElement) => {
            const elmTarget = elmTrigger.getAttribute('data-tabs-target')
            if (elmTarget !== '') {
                tabsElms.push({
                    id: elmTarget,
                    triggerEl: elmTrigger,
                    targetEl: document.querySelector(elmTarget)
                })
            }
        })
    })

    const options = {
        defaultTabId: '#setting',
        activeClasses: 'border-b-2 border-blue-700 text-blue-700',
        inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 text-gray-400',
        onShow: (x: any) => {
            const {id} = x._activeTab

            if (id === '#dokumen') {
                showHiddenElmAndText(btnTambahDokumen)
            } else {
                hiddenElm(btnTambahDokumen)
            }
        }
    }

    const tab = new Tabs(roleExTabs, tabsElms, options)
    //endregion

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {

                    // $(customerId).val('').trigger('change.select2')
                    $(customerLokasiId).val('').trigger('change.select2')
                    $(siteIdOld).val('')
                    $(siteId).val('').trigger('change.select2')
                    $(tipeLogger).val('1').trigger('change.select2')
                    $(platformUidOld).val('')
                    $(platformUid).val('')
                    $(lokasiPlatform).val('')
                    $(alamatLokasiPlatform).val('')
                    $(nomorModem).val('')
                    $(tanggalIsiModem).val('')
                    $(phMutuMin).val('')
                    $(phMutuMax).val('')
                    $(phWarnMin).val('')
                    $(phWarnMax).val('')
                    $(intermitPh).prop('checked', 0)
                    $(codLowMutu).val('')
                    $(codLowWarn).val('')
                    $(codHighWarn).val('')
                    $(codHighMutu).val('')
                    $(intermitCod).prop('checked', 0)
                    $(tssLowMutu).val('')
                    $(tssLowWarn).val('')
                    $(tssHighMutu).val('')
                    $(tssHighWarn).val('')
                    $(intermitTss).prop('checked', 0)
                    $(nh3nLowMutu).val('')
                    $(nh3nLowWarn).val('')
                    $(nh3nHighWarn).val('')
                    $(nh3nHighMutu).val('')
                    $(intermitNh3n).prop('checked', 0)
                    $(debitLowMutu).val('')
                    $(debitLowWarn).val('')
                    $(debitHighMutu).val('')
                    $(debitHighWarn).val('')
                    $(intermitDebit).prop('checked', '')

                    $(formParamPh).hide()
                    $(formParamDebit).hide()
                    $(formParamCod).hide()
                    $(formParamTss).hide()
                    $(formParamNh3n).hide()

                    responseMessages(customerIdError, [])
                    responseMessages(siteIdError, [])
                    responseMessages(tipeLoggerError, [])
                    responseMessages(platformUidError, [])
                    responseMessages(lokasiPlatformError, [])
                    responseMessages(phMutuMinError, [])
                    responseMessages(phMutuMaxError, [])
                    responseMessages(phWarnMinError, [])
                    responseMessages(phWarnMaxError, [])
                    responseMessages(codLowMutuError, [])
                    responseMessages(codLowWarnError, [])
                    responseMessages(codHighWarnError, [])
                    responseMessages(codHighMutuError, [])
                    responseMessages(tssLowMutuError, [])
                    responseMessages(tssLowWarnError, [])
                    responseMessages(tssHighWarnError, [])
                    responseMessages(tssHighMutuError, [])
                    responseMessages(nh3nLowMutuError, [])
                    responseMessages(nh3nLowWarnError, [])
                    responseMessages(nh3nHighWarnError, [])
                    responseMessages(nh3nHighMutuError, [])
                    responseMessages(debitLowMutuError, [])
                    responseMessages(debitLowWarnError, [])
                    responseMessages(debitHighWarnError, [])
                    responseMessages(debitHighMutuError, [])

                    $(noDokumen).show()
                    $(tBodyDokumen).html(null)

                    tab.show('#setting', true)
                })
            }

            if (modalPencarian) {
                closeModalDialog(modalPencarian)
            }
        })
    })

    if (closeModalUpload) {
        closeModalUpload.addEventListener('click', function () {
            closeModalDialog(modalUpload)
        })
    }
    //endregion

    //region Handle Pencarian
    if (btnPencarian !== null) {
        btnPencarian.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const lookCustomerId: HTMLInputElement = modalPencarian.querySelector('.lookCustomerId')
                const lookCustomerLokasiId: HTMLSelectElement = modalPencarian.querySelector('.lookCustomerLokasiId')
                const lookSiteId: HTMLSelectElement = modalPencarian.querySelector('.lookSiteId')

                new DataCustomerLokasiModel(lookCustomerId, lookCustomerLokasiId)
                new DataSiteModel(lookCustomerLokasiId, lookSiteId)

                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                modalPencarian.addEventListener('keypress', function (ev) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnCari.addEventListener('click', function () {
                    const elmPencarian = modalPencarian.querySelectorAll<HTMLInputElement>('[name]')
                    const text_result = []
                    elmPencarian.forEach((elm) => {
                        const elmNames = elm.getAttribute('name')
                        if (elm.value !== '')
                            text_result.push(`${elmNames}=${elm.value}`)
                    })

                    const win: Window = window
                    win.location = `/master/logger?${text_result.join('&')}`
                })
            })
        })
    }
    //endregion

    //region Handle Tambah
    if (btnTambah) {
        btnTambah.addEventListener('click', function () {
            showModalDialog(modalForm, '<i class="fas fa-plus-circle mr-2"></i> Tambah Logger', () => {

                new DataCustomerLokasiModel(customerId, customerLokasiId)
                new DataSiteModel(customerLokasiId, siteId)

                hiddenElm(btnHapus)
                if (btnMonitor) {
                    hiddenElm(btnMonitor)
                }

                //region Handle Form Parameter
                let tipeParam = handleFormParameter($(customerId).find('option:selected').data('param'))
                $(customerId).on('change', function () {
                    const dataParam = $(this).find('option:selected').data('param')
                    if (compareArrays(dataParam, ['pH', 'TSS', 'Debit'])) {
                        $(formParamPh).show()
                        $(formParamDebit).show()
                        $(formParamCod).hide()
                        $(formParamTss).show()
                        $(formParamNh3n).hide()

                        $(formReParamPh).show()
                        $(formReParamDebit).show()
                        $(formReParamCod).hide()
                        $(formReParamTss).show()
                        $(formReParamNh3n).hide()

                        tipeParam = 1
                    } else if (compareArrays(dataParam, ['pH', 'COD', 'TSS', 'Debit'])) {
                        $(formParamPh).show()
                        $(formParamDebit).show()
                        $(formParamCod).show()
                        $(formParamTss).show()
                        $(formParamNh3n).hide()

                        tipeParam = 2
                    } else if (compareArrays(dataParam, ['pH', 'COD', 'NH3N', 'Debit'])) {
                        $(formParamPh).show()
                        $(formParamDebit).show()
                        $(formParamCod).show()
                        $(formParamTss).hide()
                        $(formParamNh3n).show()

                        tipeParam = 3
                    } else if (compareArrays(dataParam, ['pH', 'COD', 'TSS', 'NH3N', 'Debit'])) {
                        $(formParamPh).show()
                        $(formParamDebit).show()
                        $(formParamCod).show()
                        $(formParamTss).show()
                        $(formParamNh3n).show()

                        tipeParam = 4
                    }
                })
                //endregion

                //region Handle Lihat Maps
                if (btnLihatMaps) {
                    $(btnLihatMaps).off('click').on('click', function () {
                        handleMaps()
                    })
                }
                //endregion

                //region Handle Dokumen
                if (btnTambahDokumen) {
                    btnTambahDokumen.addEventListener('click', function () {
                        showModalDialog(modalUpload, '<i class="fas fa-cloud-upload mr-2"></i> Upload Dokumen', () => {

                            fileDokumen.addEventListener('change', function () {
                                getFileBase64(fileDokumen.files[0]).then(async (encode: string) => {
                                    const parseEncode = encode.split(';')
                                    const parseExtension = parseEncode[0].split(':')
                                    const mimeType = parseExtension[1]

                                    fileDokumenName.value = `${fileDokumen.files[0].name}`
                                    fileDokumenBase64.value = encode
                                    fileDokumenMimeType.value = mimeType
                                    fileDokumenSize.value = `${fileDokumen.files[0].size}`
                                    fileDokumenUrl.value = URL.createObjectURL(fileDokumen.files[0])
                                })
                            })

                            if (btnSimpanUpload) {
                                $(btnSimpanUpload).off('click').on('click', function () {
                                    $(noDokumen).hide()
                                    $(tBodyDokumen).append(`
                                        <tr class="dataDokumen">
                                            <td class="text-center indexData">1</td>
                                            <td class="text-left">
                                                <a href="${fileDokumenUrl.value}" target="_blank">
                                                    ${namaDokumen.value}
                                                </a>
                                                <input type="hidden" class="namaDokumen" value="${namaDokumen.value}">
                                            </td>
                                            <td class="text-left">
                                                <a href="${fileDokumenUrl.value}" target="_blank">
                                                    ${fileDokumenName.value}
                                                </a>
                                            </td>
                                            <td class="text-left">
                                                ${fileDokumenMimeType.value}
                                                <input type="hidden" class="fileName" value="${fileDokumenName.value}">
                                                <input type="hidden" class="fileBase64" value="${fileDokumenBase64.value}">
                                                <input type="hidden" class="fileMimeType" value="${fileDokumenMimeType.value}">
                                            </td>
                                            <td class="text-right">
                                                ${formatBytes(parseFloat(fileDokumenSize.value))}
                                            </td>
                                            <td class="text-center">
                                                <a class="btnDeleteFile">
                                                    <i class="fas fa-trash"></i>
                                                </a>
                                            </td>
                                        </tr>
                                    `)

                                    closeModalDialog(modalUpload, () => {
                                        namaDokumen.value = ''
                                        fileDokumen.value = ''
                                        fileDokumenName.value = ''
                                        fileDokumenBase64.value = ''
                                        fileDokumenMimeType.value = ''
                                        fileDokumenSize.value = ''
                                        fileDokumenUrl.value = ''
                                    })

                                    handleTableDokumen()

                                })
                            }

                        })
                    })
                }
                //endregion

                //region Handle Simpan Logger
                if (btnSimpan) {
                    btnSimpan.addEventListener('click', function () {
                        const dataDokumen = $('.dataDokumen')

                        const dataForm = new FormData()
                        dataForm.append('customer_id', customerId.value)
                        dataForm.append('customer_lokasi_id', customerLokasiId.value)
                        dataForm.append('site_id', siteId.value)
                        dataForm.append('tipe_logger', tipeLogger.value)
                        dataForm.append('uid', platformUid.value)
                        dataForm.append('catchment_area', catchmentArea.value)
                        dataForm.append('badan_air', badanAir.value)
                        dataForm.append('serial_number', serialNumber.value)
                        dataForm.append('lokasi_platform', lokasiPlatform.value)
                        dataForm.append('alamat_platform', alamatLokasiPlatform.value)
                        dataForm.append('nomor_gsm_modem', nomorModem.value)
                        dataForm.append('tanggal_pengisian_modem', tanggalIsiModem.value)
                        dataForm.append('tipe_param', `${tipeParam}`)
                        dataForm.append('ph_mutu_min', phMutuMin.value)
                        dataForm.append('ph_mutu_max', phMutuMax.value)
                        dataForm.append('ph_warn_min', phWarnMin.value)
                        dataForm.append('ph_warn_max', phWarnMax.value)
                        dataForm.append('ph_intermit', $(intermitPh).is(':checked') ? '1' : '0')
                        dataForm.append('cod_warn', codLowMutu.value)
                        dataForm.append('cod_warn_min', codLowWarn.value)
                        dataForm.append('cod_mutu_min', codHighWarn.value)
                        dataForm.append('cod_mutu', codHighMutu.value)
                        dataForm.append('cod_intermit', $(intermitCod).is(':checked') ? '1' : '0')
                        dataForm.append('tss_warn', tssLowMutu.value)
                        dataForm.append('tss_warn_min', tssLowWarn.value)
                        dataForm.append('tss_mutu_min', tssHighWarn.value)
                        dataForm.append('tss_mutu', tssHighMutu.value)
                        dataForm.append('tss_intermit', $(intermitTss).is(':checked') ? '1' : '0')
                        dataForm.append('nh3n_warn', nh3nLowMutu.value)
                        dataForm.append('nh3n_warn_min', nh3nLowWarn.value)
                        dataForm.append('nh3n_mutu_min', nh3nHighWarn.value)
                        dataForm.append('nh3n_mutu', nh3nHighMutu.value)
                        dataForm.append('nh3n_intermit', $(intermitNh3n).is(':checked') ? '1' : '0')
                        dataForm.append('debit_warn', debitLowMutu.value)
                        dataForm.append('debit_warn_min', debitLowWarn.value)
                        dataForm.append('debit_mutu_min', debitHighWarn.value)
                        dataForm.append('debit_mutu', debitHighMutu.value)
                        dataForm.append('debit_intermit', $(intermitDebit).is(':checked') ? '1' : '0')

                        dataForm.append('tipe_monitor', isTipeMonitor.checked ? '2' : '1')
                        dataForm.append('ph_re_warn_min', phReSensorMin.value)
                        dataForm.append('ph_re_warn_max', phReSensorMax.value)
                        dataForm.append('ph_bottom_min', phReMutuMin.value)
                        dataForm.append('ph_bottom_max', phReWarnMin.value)
                        dataForm.append('ph_upper_min', phReWarnMax.value)
                        dataForm.append('ph_upper_max', phReMutuMax.value)

                        dataForm.append('cod_re_warn_min', codReSensorMin.value)
                        dataForm.append('cod_re_warn_max', codReSensorMax.value)
                        dataForm.append('cod_bottom_min', codReMutuMin.value)
                        dataForm.append('cod_bottom_max', codReWarnMin.value)
                        dataForm.append('cod_upper_min', codReWarnMax.value)
                        dataForm.append('cod_upper_max', codReMutuMax.value)

                        dataForm.append('tss_re_warn_min', tssReSensorMin.value)
                        dataForm.append('tss_re_warn_max', tssReSensorMax.value)
                        dataForm.append('tss_bottom_min', tssReMutuMin.value)
                        dataForm.append('tss_bottom_max', tssReWarnMin.value)
                        dataForm.append('tss_upper_min', tssReWarnMax.value)
                        dataForm.append('tss_upper_max', tssReMutuMax.value)

                        dataForm.append('nh3n_re_warn_min', nh3nReSensorMin.value)
                        dataForm.append('nh3n_re_warn_max', nh3nReSensorMax.value)
                        dataForm.append('nh3n_bottom_min', nh3nReMutuMin.value)
                        dataForm.append('nh3n_bottom_max', nh3nReWarnMin.value)
                        dataForm.append('nh3n_upper_min', nh3nReWarnMax.value)
                        dataForm.append('nh3n_upper_max', nh3nReMutuMax.value)

                        dataForm.append('debit_re_warn_min', debitReSensorMin.value)
                        dataForm.append('debit_re_warn_max', debitReSensorMax.value)
                        dataForm.append('debit_bottom_min', debitReMutuMin.value)
                        dataForm.append('debit_bottom_max', debitReWarnMin.value)
                        dataForm.append('debit_upper_min', debitReWarnMax.value)
                        dataForm.append('debit_upper_max', debitReMutuMax.value)

                        dataDokumen.map(async (index, elm) => {
                            const namaDokumen: HTMLInputElement = elm.querySelector('.namaDokumen')
                            const fileName: HTMLInputElement = elm.querySelector('.fileName')
                            const fileBase64: HTMLInputElement = elm.querySelector('.fileBase64')
                            const fileMimeType: HTMLInputElement = elm.querySelector('.fileMimeType')

                            dataForm.append('nama_dokumen[]', namaDokumen.value)
                            dataForm.append('files[]', await fileUrlToFile(fileBase64.value, fileName.value, fileMimeType.value))
                        })

                        confirmAlert({
                            title: 'Konfirmasi',
                            html: 'Apakah anda akan membuat data Logger baru?',
                            confirmButtonText: 'Ya, Simpan',
                            showDenyButton: true,
                            denyButtonText: 'Tidak'
                        }, async () => {
                            await waitLoader('Mohon Tunggu...', 'Menyimpan data Logger baru', async () => {
                                const response = await fetch('/master/logger/store', {
                                    method: 'POST',
                                    headers: {
                                        // 'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: dataForm
                                })

                                await handleResponse(response)
                            })
                        })
                    })
                }
                //endregion

            })
        })
    }
    //endregion

    //region Handle Update dan Delete
    if (dataTables) {
        dataTables.forEach((item) => {
            const btnEdit = item.querySelector('.btnEdit')
            const dataItems = item.getAttribute('data-items')

            if (btnEdit) {
                $(btnEdit).off('click').on('click', function () {
                    showModalDialog(modalForm, '<i class="fas fa-edit mr-2"></i> Update Logger', () => {

                        showHiddenElmAndText(btnHapus)

                        if (btnMonitor) {
                            showHiddenElmAndText(btnMonitor)
                        }

                        //region Handle Parsing Data
                        const {
                            monitor_uniq_id,
                            uid,
                            customer_id,
                            serial_number,
                            site_id,
                            tipe_logger,
                            lat,
                            lng,
                            alamat_platform,
                            nomor_gsm_modem,
                            tanggal_pengisian_modem,
                            site,
                            param_limit,
                            dokumen,
                            param_range
                        } = JSON.parse(dataItems)

                        const {customer_lokasi_id, customer} = site
                        const {jenis_industri} = customer
                        const {parameter} = jenis_industri
                        const {
                            ph_mutu_min,
                            ph_mutu_max,
                            ph_warn_min,
                            ph_warn_max,
                            ph_intermit,
                            cod_warn,
                            cod_warn_min,
                            cod_mutu_min,
                            cod_mutu,
                            cod_intermit,
                            tss_warn,
                            tss_warn_min,
                            tss_mutu_min,
                            tss_mutu,
                            tss_intermit,
                            nh3n_warn,
                            nh3n_warn_min,
                            nh3n_mutu_min,
                            nh3n_mutu,
                            nh3n_intermit,
                            debit_warn,
                            debit_warn_min,
                            debit_mutu_min,
                            debit_mutu,
                            debit_intermit,
                        } = param_limit

                        const {
                            tipe_monitor,
                            ph_re_warn_min,
                            ph_re_warn_max,
                            ph_bottom_min,
                            ph_bottom_max,
                            ph_upper_min,
                            ph_upper_max,

                            tss_re_warn_min,
                            tss_re_warn_max,
                            tss_bottom_min,
                            tss_bottom_max,
                            tss_upper_min,
                            tss_upper_max,

                            debit_re_warn_min,
                            debit_re_warn_max,
                            debit_bottom_min,
                            debit_bottom_max,
                            debit_upper_min,
                            debit_upper_max,
                        } = param_range ?? {}

                        const customerLokasiModel = new DataCustomerLokasiModel(customerId, customerLokasiId)
                        const siteModel = new DataSiteModel(customerLokasiId, siteId)

                        $(customerId).val(customer_id).trigger('change.select2')
                        $(serialNumber).val(serial_number)
                        $(siteIdOld).val(site_id)
                        customerLokasiModel.selectedData(customer_id, customer_lokasi_id)
                        siteModel.selectedData(customer_lokasi_id, site_id)
                        $(tipeLogger).val(tipe_logger).trigger('change.select2')
                        $(platformUidOld).val(uid)
                        $(platformUid).val(uid)
                        $(lokasiPlatform).val(`${lat}, ${lng}`)
                        $(alamatLokasiPlatform).val(alamat_platform)
                        $(nomorModem).val(nomor_gsm_modem)
                        $(tanggalIsiModem).val(tanggal_pengisian_modem)
                        $(phMutuMin).val(ph_mutu_min)
                        $(phMutuMax).val(ph_mutu_max)
                        $(phWarnMin).val(ph_warn_min)
                        $(phWarnMax).val(ph_warn_max)
                        $(intermitPh).prop('checked', ph_intermit === 1)
                        $(codLowMutu).val(cod_warn)
                        $(codLowWarn).val(cod_warn_min)
                        $(codHighWarn).val(cod_mutu_min)
                        $(codHighMutu).val(cod_mutu)
                        $(intermitCod).prop('checked', cod_intermit === 1)
                        $(tssLowMutu).val(tss_warn)
                        $(tssLowWarn).val(tss_warn_min)
                        $(tssHighWarn).val(tss_mutu_min)
                        $(tssHighMutu).val(tss_mutu)
                        $(intermitTss).prop('checked', tss_intermit === 1)
                        $(nh3nLowMutu).val(nh3n_warn)
                        $(nh3nLowWarn).val(nh3n_warn_min)
                        $(nh3nHighWarn).val(nh3n_mutu_min)
                        $(nh3nHighMutu).val(nh3n_mutu)
                        $(intermitNh3n).prop('checked', nh3n_intermit === 1)
                        $(debitLowMutu).val(debit_warn)
                        $(debitLowWarn).val(debit_warn_min)
                        $(debitHighWarn).val(debit_mutu_min)
                        $(debitHighMutu).val(debit_mutu)
                        $(intermitDebit).prop('checked', debit_intermit === 1)

                        isTipeMonitor.checked = tipe_monitor !== 1
                        $(phReSensorMin).val(ph_re_warn_min)
                        $(phReSensorMax).val(ph_re_warn_max)
                        $(phReMutuMin).val(ph_bottom_min)
                        $(phReWarnMin).val(ph_bottom_max)
                        $(phReWarnMax).val(ph_upper_min)
                        $(phReMutuMax).val(ph_upper_max)

                        $(tssReSensorMin).val(tss_re_warn_min)
                        $(tssReSensorMax).val(tss_re_warn_max)
                        $(tssReMutuMin).val(tss_bottom_min)
                        $(tssReWarnMin).val(tss_bottom_max)
                        $(tssReWarnMax).val(tss_upper_min)
                        $(tssReMutuMax).val(tss_upper_max)

                        $(debitReSensorMin).val(debit_re_warn_min)
                        $(debitReSensorMax).val(debit_re_warn_max)
                        $(debitReMutuMin).val(debit_bottom_min)
                        $(debitReWarnMin).val(debit_bottom_max)
                        $(debitReWarnMax).val(debit_upper_min)
                        $(debitReMutuMax).val(debit_upper_max)
                        //endregion

                        //region Handle Form Parameter
                        let tipeParam = 0
                        tipeParam = handleFormParameter(JSON.parse(parameter))
                        $(customerId).on('change', function () {
                            const dataParam = $(this).find('option:selected').data('param')
                            tipeParam = handleFormParameter(dataParam)
                        })
                        //endregion

                        //region Handle Lihat Map
                        if (btnLihatMaps) {
                            $(btnLihatMaps).off('click').on('click', function () {
                                handleMaps(parseFloat(lat), parseFloat(lng))
                            })
                        }
                        //endregion

                        if (btnMonitor) {
                            $(btnMonitor).off('click').on('click', function () {
                                window.open(`/monitor/detail/${monitor_uniq_id}/${tipe_logger}`, '_blank').focus()
                            })
                        }

                        //region Handle Dokumen
                        if (dokumen.length !== 0) {
                            let noIndex = 0
                            dokumen.map((item: any) => {
                                const {id, nama_dokumen, lokasi_file, nama_file, tipe_file, ukuran_file} = item
                                $(noDokumen).hide()

                                noIndex++
                                $(tBodyDokumen).append(`
                                    <tr class="dataDokumen">
                                        <td class="text-center indexData">${noIndex}</td>
                                        <td class="text-left">
                                            <a href="/storage/${lokasi_file}/${nama_file}" target="_blank">
                                                ${nama_dokumen}
                                            </a>
                                            <input type="hidden" class="dokumenId" value="${id}">
                                        </td>
                                        <td class="text-left">
                                            <a href="/storage/${lokasi_file}/${nama_file}" target="_blank">
                                                ${nama_file}
                                            </a>
                                        </td>
                                        <td class="text-left">
                                            ${tipe_file}
                                        </td>
                                        <td class="text-right">
                                            ${formatBytes(parseFloat(ukuran_file))}
                                        </td>
                                        <td class="text-center">
                                            <a class="btnDeleteFile">
                                                <i class="fas fa-trash"></i>
                                            </a>
                                        </td>
                                    </tr>
                                `)
                            })

                            handleTableDokumen()
                        } else {
                            $(noDokumen).show()
                            $(tBodyDokumen).html(null)
                        }

                        if (btnTambahDokumen) {
                            btnTambahDokumen.addEventListener('click', function () {
                                showModalDialog(modalUpload, '<i class="fas fa-cloud-upload mr-2"></i> Upload Dokumen', () => {

                                    fileDokumen.addEventListener('change', function () {
                                        getFileBase64(fileDokumen.files[0]).then(async (encode: string) => {
                                            const parseEncode = encode.split(';')
                                            const parseExtension = parseEncode[0].split(':')
                                            const mimeType = parseExtension[1]

                                            fileDokumenName.value = `${fileDokumen.files[0].name}`
                                            fileDokumenBase64.value = encode
                                            fileDokumenMimeType.value = mimeType
                                            fileDokumenSize.value = `${fileDokumen.files[0].size}`
                                            fileDokumenUrl.value = URL.createObjectURL(fileDokumen.files[0])
                                        })
                                    })

                                    if (btnSimpanUpload) {
                                        $(btnSimpanUpload).off('click').on('click', function () {
                                            $(noDokumen).hide()
                                            $(tBodyDokumen).append(`
                                                <tr class="dataDokumen">
                                                    <td class="text-center indexData">1</td>
                                                    <td class="text-left">
                                                        <a href="${fileDokumenUrl.value}" target="_blank">
                                                            ${namaDokumen.value}
                                                        </a>
                                                        <input type="hidden" class="dokumenId" value="">
                                                        <input type="hidden" class="namaDokumen" value="${namaDokumen.value}">
                                                    </td>
                                                    <td class="text-left">
                                                        <a href="${fileDokumenUrl.value}" target="_blank">
                                                            ${fileDokumenName.value}
                                                        </a>
                                                    </td>
                                                    <td class="text-left">
                                                        ${fileDokumenMimeType.value}
                                                        <input type="hidden" class="fileName" value="${fileDokumenName.value}">
                                                        <input type="hidden" class="fileBase64" value="${fileDokumenBase64.value}">
                                                        <input type="hidden" class="fileMimeType" value="${fileDokumenMimeType.value}">
                                                    </td>
                                                    <td class="text-right">
                                                        ${formatBytes(parseFloat(fileDokumenSize.value))}
                                                    </td>
                                                    <td class="text-center">
                                                        <a class="btnDeleteFile">
                                                            <i class="fas fa-trash"></i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            `)

                                            closeModalDialog(modalUpload, () => {
                                                namaDokumen.value = ''
                                                fileDokumen.value = ''
                                                fileDokumenName.value = ''
                                                fileDokumenBase64.value = ''
                                                fileDokumenMimeType.value = ''
                                                fileDokumenSize.value = ''
                                                fileDokumenUrl.value = ''
                                            })

                                            handleTableDokumen()

                                        })
                                    }

                                })
                            })
                        }
                        //endregion

                        if (btnSimpan) {
                            $(btnSimpan).off('click').on('click', function () {
                                const dataDokumen = $('.dataDokumen')

                                const dataForm = new FormData()
                                dataForm.append('customer_id', customerId.value)
                                dataForm.append('customer_lokasi_id', customerLokasiId.value)
                                dataForm.append('site_id_old', siteIdOld.value)
                                dataForm.append('site_id', siteId.value)
                                dataForm.append('tipe_logger', tipeLogger.value)
                                dataForm.append('uid_old', platformUidOld.value)
                                dataForm.append('uid', platformUid.value)
                                dataForm.append('catchment_area', catchmentArea.value)
                                dataForm.append('badan_air', badanAir.value)
                                dataForm.append('serial_number', serialNumber.value)
                                dataForm.append('lokasi_platform', lokasiPlatform.value)
                                dataForm.append('alamat_platform', alamatLokasiPlatform.value)
                                dataForm.append('nomor_gsm_modem', nomorModem.value)
                                dataForm.append('tanggal_pengisian_modem', tanggalIsiModem.value)
                                dataForm.append('tipe_param', `${tipeParam}`)
                                dataForm.append('ph_mutu_min', phMutuMin.value)
                                dataForm.append('ph_mutu_max', phMutuMax.value)
                                dataForm.append('ph_warn_min', phWarnMin.value)
                                dataForm.append('ph_warn_max', phWarnMax.value)
                                dataForm.append('ph_intermit', $(intermitPh).is(':checked') ? '1' : '0')
                                dataForm.append('cod_warn', codLowMutu.value)
                                dataForm.append('cod_warn_min', codLowWarn.value)
                                dataForm.append('cod_mutu_min', codHighWarn.value)
                                dataForm.append('cod_mutu', codHighMutu.value)
                                dataForm.append('cod_intermit', $(intermitCod).is(':checked') ? '1' : '0')
                                dataForm.append('tss_warn', tssLowMutu.value)
                                dataForm.append('tss_warn_min', tssLowWarn.value)
                                dataForm.append('tss_mutu_min', tssHighWarn.value)
                                dataForm.append('tss_mutu', tssHighMutu.value)
                                dataForm.append('tss_intermit', $(intermitTss).is(':checked') ? '1' : '0')
                                dataForm.append('nh3n_warn', nh3nLowMutu.value)
                                dataForm.append('nh3n_warn_min', nh3nLowWarn.value)
                                dataForm.append('nh3n_mutu_min', nh3nHighWarn.value)
                                dataForm.append('nh3n_mutu', nh3nHighMutu.value)
                                dataForm.append('nh3n_intermit', $(intermitNh3n).is(':checked') ? '1' : '0')
                                dataForm.append('debit_warn', debitLowMutu.value)
                                dataForm.append('debit_warn_min', debitLowWarn.value)
                                dataForm.append('debit_mutu_min', debitHighWarn.value)
                                dataForm.append('debit_mutu', debitHighMutu.value)
                                dataForm.append('debit_intermit', $(intermitDebit).is(':checked') ? '1' : '0')

                                dataForm.append('tipe_monitor', isTipeMonitor.checked ? '2' : '1')
                                dataForm.append('ph_re_warn_min', phReSensorMin.value)
                                dataForm.append('ph_re_warn_max', phReSensorMax.value)
                                dataForm.append('ph_bottom_min', phReMutuMin.value)
                                dataForm.append('ph_bottom_max', phReWarnMin.value)
                                dataForm.append('ph_upper_min', phReWarnMax.value)
                                dataForm.append('ph_upper_max', phReMutuMax.value)

                                dataForm.append('cod_re_warn_min', codReSensorMin.value)
                                dataForm.append('cod_re_warn_max', codReSensorMax.value)
                                dataForm.append('cod_bottom_min', codReMutuMin.value)
                                dataForm.append('cod_bottom_max', codReWarnMin.value)
                                dataForm.append('cod_upper_min', codReWarnMax.value)
                                dataForm.append('cod_upper_max', codReMutuMax.value)

                                dataForm.append('tss_re_warn_min', tssReSensorMin.value)
                                dataForm.append('tss_re_warn_max', tssReSensorMax.value)
                                dataForm.append('tss_bottom_min', tssReMutuMin.value)
                                dataForm.append('tss_bottom_max', tssReWarnMin.value)
                                dataForm.append('tss_upper_min', tssReWarnMax.value)
                                dataForm.append('tss_upper_max', tssReMutuMax.value)

                                dataForm.append('nh3n_re_warn_min', nh3nReSensorMin.value)
                                dataForm.append('nh3n_re_warn_max', nh3nReSensorMax.value)
                                dataForm.append('nh3n_bottom_min', nh3nReMutuMin.value)
                                dataForm.append('nh3n_bottom_max', nh3nReWarnMin.value)
                                dataForm.append('nh3n_upper_min', nh3nReWarnMax.value)
                                dataForm.append('nh3n_upper_max', nh3nReMutuMax.value)

                                dataForm.append('debit_re_warn_min', debitReSensorMin.value)
                                dataForm.append('debit_re_warn_max', debitReSensorMax.value)
                                dataForm.append('debit_bottom_min', debitReMutuMin.value)
                                dataForm.append('debit_bottom_max', debitReWarnMin.value)
                                dataForm.append('debit_upper_min', debitReWarnMax.value)
                                dataForm.append('debit_upper_max', debitReMutuMax.value)

                                dataDokumen.map(async (index, elm) => {
                                    const dokumenId: HTMLInputElement = elm.querySelector('.dokumenId')
                                    const namaDokumen: HTMLInputElement = elm.querySelector('.namaDokumen')
                                    const fileName: HTMLInputElement = elm.querySelector('.fileName')
                                    const fileBase64: HTMLInputElement = elm.querySelector('.fileBase64')
                                    const fileMimeType: HTMLInputElement = elm.querySelector('.fileMimeType')

                                    if (dokumenId.value === '') {
                                        dataForm.append('nama_dokumen[]', namaDokumen.value)
                                        dataForm.append('files[]', await fileUrlToFile(fileBase64.value, fileName.value, fileMimeType.value))
                                    } else {
                                        dataForm.append('dokumen_id[]', dokumenId.value)
                                    }
                                })

                                confirmAlert({
                                    title: 'Konfirmasi',
                                    html: 'Apakah anda akan mengubah data Logger?',
                                    confirmButtonText: 'Ya, Simpan',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menyimpan Perubahan data Logger', async () => {
                                        const response = await fetch('/master/logger/update', {
                                            method: 'POST',
                                            headers: {
                                                // 'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: dataForm,
                                        })

                                        await handleResponse(response)
                                    })
                                })
                            })
                        }

                        showHiddenElmAndText(btnHapus)
                        if (btnHapus) {
                            btnHapus.addEventListener('click', function () {
                                confirmAlert({
                                    title: 'Konfirmasi',
                                    html: 'Apakah anda akan menghapus data Logger ini?',
                                    confirmButtonText: 'Ya, Hapus',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menghapus data Logger', async () => {
                                        const response = await fetch('/master/logger/delete', {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: JSON.stringify({
                                                uid: platformUid.value,
                                                tipeLogger: tipeLogger.value,
                                            })
                                        })

                                        await handleResponse(response)
                                    })
                                })
                            })
                        }
                    })
                })
            }
        })
    }
    //endregion

    //region Handle Table Dokumen
    function handleTableDokumen() {
        const dataDokumen = $('.dataDokumen')
        let noIndex = 0
        dataDokumen.map((index, elm) => {
            noIndex = index + 1
            const indexData = elm.querySelector('.indexData')
            const btnDeleteFile = elm.querySelector('.btnDeleteFile')
            $(indexData).text(noIndex)

            $(btnDeleteFile).off('click').on('click', function () {
                $(elm).remove()
                handleTableDokumen()

                if (dataDokumen.length - 1 === 0) {
                    $(noDokumen).show()
                }
            })
        })
    }

    //endregion

    //region Handle Maps
    const handleMaps = (lat?: number, lng?: number) => {
        showModalDialog(modalFormMaps, null, (callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) => {
            const closeModalFormMaps = modalFormMaps.querySelector('.closeModalFormMaps')
            const mapsBody = modalFormMaps.querySelector('#mapsBody')
            const markerImage = modalFormMaps.querySelector('.markerImage')
            const cariAlamatMaps: HTMLInputElement = modalFormMaps.querySelector('.cariAlamatMaps')
            const alamatLat: HTMLInputElement = modalFormMaps.querySelector('.alamatLat')
            const alamatLng: HTMLInputElement = modalFormMaps.querySelector('.alamatLng')
            const alamatFormatted: HTMLInputElement = modalFormMaps.querySelector('.alamatFormatted')
            const btnSimpanMaps: HTMLInputElement = modalFormMaps.querySelector('.btnSimpanMaps')

            if (closeModalFormMaps) {
                $(closeModalFormMaps).off('click').on('click', function () {
                    closeModalDialog(modalFormMaps)
                })
            }

            const loader = new Loader({
                apiKey: "AIzaSyAGK1ffZ1HjoenaTDRZDEV5HW783uTC7EY",
                version: "weekly",
                libraries: ["places"]
            })

            loader.load().then(async (google) => {
                // @ts-ignore
                const {Map} = await google.maps.importLibrary("maps")

                const alamatDefault = ''
                const alamatLatDefault = lat ?? -2.44565
                const alamatLngDefault = lng ?? 117.8888

                cariAlamatMaps.value = alamatDefault

                //region Handle Map Options
                const center = {lat: alamatLatDefault, lng: alamatLngDefault}
                const map = new Map(mapsBody, {
                    center: center,
                    zoom: 5,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.LEFT_BOTTOM
                    },
                })

                if (alamatDefault !== '') map.setZoom(17)
                //endregion

                //region Handle Map Style
                let hideLabels = [{
                    featureType: "administrative.province",
                    stylers: [{visibility: "on"}]
                }, {
                    featureType: "administrative.locality",
                    stylers: [{visibility: "on"}]
                }, {
                    featureType: "poi",
                    stylers: [{visibility: "off"}]
                }, {
                    featureType: 'transit',
                    stylers: [{visibility: 'on'}]
                }, {
                    featureType: 'landscape.natural',
                    stylers: [{visibility: 'off'}]
                }];

                map.setOptions({styles: hideLabels});
                //endregion

                const geocoder = new google.maps.Geocoder()

                google.maps.event.addListener(map, "idle", function () {
                    const center = this.getCenter()
                    alamatLat.value = center.lat()
                    alamatLng.value = center.lng()

                    const latlng = new google.maps.LatLng(center.lat(), center.lng())

                    //region Handle Geocode
                    // @ts-ignore
                    geocoder.geocode({'latLng': latlng}, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results.length >= 0) {
                                if (results[1]) {
                                    alamatFormatted.value = results[1].formatted_address
                                }
                            }
                        }
                    })
                    //endregion

                    //region Handle Conversi Lat/Lng ke Pixel
                    const projection = map.getProjection();
                    const bounds = map.getBounds();
                    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
                    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
                    const scale = Math.pow(2, map.getZoom());
                    const worldPoint = projection.fromLatLngToPoint(latlng);
                    const pixelConvert = [Math.floor((worldPoint.x - bottomLeft.x) * scale), Math.floor((worldPoint.y - topRight.y) * scale)]

                    $(markerImage).css('left', `${pixelConvert[0] - 16}px`)
                    $(markerImage).css('top', `${pixelConvert[1] - 34}px`)
                    //endregion
                })

                //region Handle Autocomplete
                const autocomplete = new google.maps.places.Autocomplete(cariAlamatMaps, {
                    fields: ["formatted_address", "geometry", "name"],
                    strictBounds: false,
                })

                autocomplete.bindTo("bounds", map)
                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace()

                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport)
                    } else {
                        map.setCenter(place.geometry.location)
                        map.setZoom(17)
                    }

                    alamatLat.value = `${place.geometry.location.lat()}`
                    alamatLng.value = `${place.geometry.location.lng()}`
                })
                //endregion

                if (btnSimpanMaps) {
                    $(btnSimpanMaps).off('click').on('click', function () {
                        lokasiPlatform.value = `${alamatLat.value}, ${alamatLng.value}`
                        alamatLokasiPlatform.value = alamatFormatted.value
                        closeModalDialog(modalFormMaps)
                    })
                }
            })
        })
    }
    //endregion

    //region Handle Form Parameter
    const handleFormParameter = (dataParam: any[]) => {
        let tipeParamNumber = 0
        if (compareArrays(dataParam, ['pH', 'TSS', 'Debit'])) {
            $(formParamPh).show()
            $(formParamDebit).show()
            $(formParamCod).hide()
            $(formParamTss).show()
            $(formParamNh3n).hide()

            $(formReParamPh).show()
            $(formReParamDebit).show()
            $(formReParamCod).hide()
            $(formReParamTss).show()
            $(formReParamNh3n).hide()

            tipeParamNumber = 1
        } else if (compareArrays(dataParam, ['pH', 'COD', 'TSS', 'Debit'])) {
            $(formParamPh).show()
            $(formParamDebit).show()
            $(formParamCod).show()
            $(formParamTss).show()
            $(formParamNh3n).hide()

            $(formReParamPh).show()
            $(formReParamDebit).show()
            $(formReParamCod).show()
            $(formReParamTss).show()
            $(formReParamNh3n).hide()

            tipeParamNumber = 2
        } else if (compareArrays(dataParam, ['pH', 'COD', 'NH3N', 'Debit'])) {
            $(formParamPh).show()
            $(formParamDebit).show()
            $(formParamCod).show()
            $(formParamTss).hide()
            $(formParamNh3n).show()

            $(formReParamPh).show()
            $(formReParamDebit).show()
            $(formReParamCod).show()
            $(formReParamTss).hide()
            $(formReParamNh3n).show()

            tipeParamNumber = 3
        } else if (compareArrays(dataParam, ['pH', 'COD', 'TSS', 'NH3N', 'Debit'])) {
            $(formParamPh).show()
            $(formParamDebit).show()
            $(formParamCod).show()
            $(formParamTss).show()
            $(formParamNh3n).show()

            $(formReParamPh).show()
            $(formReParamDebit).show()
            $(formReParamCod).show()
            $(formReParamTss).show()
            $(formReParamNh3n).show()

            tipeParamNumber = 4
        }

        return tipeParamNumber
    }
    //endregion

    //region Handle Response
    const handleResponse = async (response: Response) => {
        const {status} = response
        const {message, errorValidation} = await response.json()
        if (status === 200) {
            closeModalDialog(modalForm)
            successAlert({
                title: 'Berhasil',
                html: message,
                confirmButtonText: 'Tutup'
            }, () => {
                window.location.reload()
            })
        } else {
            if (errorValidation) {
                failureAlert({
                    title: 'Oppss!',
                    html: 'Data yang diperlukan belum lengkap'
                })

                const {
                    customer_id,
                    customer_lokasi_id,
                    site_id,
                    tipe_logger,
                    uid,
                    serial_number,
                    lokasi_platform,
                    ph_mutu_min,
                    ph_mutu_max,
                    ph_warn_min,
                    ph_warn_max,
                    cod_warn,
                    cod_warn_min,
                    cod_mutu_min,
                    cod_mutu,
                    tss_mutu_min,
                    tss_mutu,
                    tss_warn_min,
                    tss_warn,
                    nh3n_warn,
                    nh3n_warn_min,
                    nh3n_mutu_min,
                    nh3n_mutu,
                    debit_warn,
                    debit_warn_min,
                    debit_mutu_min,
                    debit_mutu,
                } = errorValidation

                responseMessages(customerIdError, customer_id)
                responseMessages(customerLokasiIdError, customer_lokasi_id)
                responseMessages(siteIdError, site_id)
                responseMessages(tipeLoggerError, tipe_logger)
                responseMessages(platformUidError, uid)
                responseMessages(serialNumberError, serial_number)
                responseMessages(lokasiPlatformError, lokasi_platform)
                responseMessages(phMutuMinError, ph_mutu_min)
                responseMessages(phMutuMaxError, ph_mutu_max)
                responseMessages(phWarnMinError, ph_warn_min)
                responseMessages(phWarnMaxError, ph_warn_max)
                responseMessages(codLowMutuError, cod_warn)
                responseMessages(codLowWarnError, cod_warn_min)
                responseMessages(codHighWarnError, cod_mutu_min)
                responseMessages(codHighMutuError, cod_mutu)
                responseMessages(tssLowMutuError, tss_mutu)
                responseMessages(tssLowWarnError, tss_mutu_min)
                responseMessages(tssHighWarnError, tss_warn_min)
                responseMessages(tssHighMutuError, tss_warn)
                responseMessages(nh3nLowMutuError, nh3n_warn)
                responseMessages(nh3nLowWarnError, nh3n_warn_min)
                responseMessages(nh3nHighWarnError, nh3n_mutu_min)
                responseMessages(nh3nHighMutuError, nh3n_mutu)
                responseMessages(debitLowMutuError, debit_warn)
                responseMessages(debitLowWarnError, debit_warn_min)
                responseMessages(debitHighWarnError, debit_mutu_min)
                responseMessages(debitHighMutuError, debit_mutu)

            } else {
                failureAlert({
                    title: 'Oppss!',
                    html: message
                })
            }
        }
    }
    //endregion

})
