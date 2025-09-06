import {formatter, getMetaContent, numberFormat} from "@/js/plugins/functions";
import {TabItem, Tabs} from "flowbite";
import {showModalDialog} from "@/js/plugins/modal";
import {waitLoader} from "@/js/plugins/sweet-alert";
import Swal from "sweetalert2";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)

    const btnCreate = document.querySelector('.btnCreate')
    const modalForm = document.querySelector('.modalForm')
    const pm25Body = modalForm.querySelector('.pm25Body')
    const calculateCalibrationPM25 = modalForm.querySelector('.calculateCalibrationPM25')
    const pm10Body = modalForm.querySelector('.pm10Body')
    const tspBody = modalForm.querySelector('.tspBody')
    const pm25Kemiringan: HTMLInputElement = modalForm.querySelector('.pm25Kemiringan')
    const pm25Intercept: HTMLInputElement = modalForm.querySelector('.pm25Intercept')

    //region Handle Tabs
    let tab: Tabs | null = null

    function initializeTabs() {
        try {
            const roleExTabs: HTMLElement = document.querySelector('[data-role="exTabs"]')
            if (!roleExTabs) {
                console.warn('Tab container [data-role="exTabs"] not found')
                return null
            }

            const roleExTabsChilds = roleExTabs.querySelectorAll('li')

            if (roleExTabsChilds.length === 0) {
                console.warn('No tab items found in container')
                return null
            }

            const tabsElms: TabItem[] = []

            roleExTabsChilds.forEach((elm) => {
                const triggerLinks = elm.querySelectorAll('[data-tabs-target]')
                triggerLinks.forEach((elmTrigger: HTMLElement) => {
                    const elmTarget = elmTrigger.getAttribute('data-tabs-target')
                    const targetElement = elmTarget ? document.querySelector(elmTarget) : null

                    if (elmTarget && targetElement) {
                        tabsElms.push({
                            id: elmTarget,
                            triggerEl: elmTrigger,
                            targetEl: targetElement
                        } as TabItem)
                    }
                })
            })

            if (tabsElms.length === 0) {
                console.warn('No valid tab elements found')
                return null
            }

            const options = {
                defaultTabId: '#platform',
                activeClasses: 'border-b-2 border-blue-700 text-blue-700',
                inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 text-gray-400',
                onShow: (x: any) => {
                    const {id} = x._activeTab
                }
            }

            return new Tabs(roleExTabs, tabsElms, options)

        } catch (error) {
            console.error('Error initializing tabs:', error)
            return null
        }
    }

    tab = initializeTabs()

    function showTab(tabId: string) {
        if (tab) {
            tab.show(tabId)
        } else {
            console.warn('Tabs not initialized')
        }
    }

    //endregion

    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            showModalDialog(modalForm, null, async function () {
                await waitLoader('Please wait...', 'Loading data for Calibration', async () => {
                    const response = await fetch(`${url}/calibration-init`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken
                        }
                    })

                    const {status} = response
                    const {message, data} = await response.json()
                    Swal.close()

                    if (status === 200) {
                        if (data) {

                            const bodyDataPM25 = []
                            const bodyDataPM10 = []
                            const bodyDataTSP = []
                            data.map((item: any) => {
                                const {
                                    date_period,
                                    pm25,
                                    pm10,
                                    tsp
                                } = item

                                //region PM 2.5
                                bodyDataPM25.push(`
                                    <div class="grid grid-cols-3 gap-4 bg-gray-50 px-4 py-4 mb-2 rounded-md pm25Calibrate">
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                                Date
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control pm25Date" disabled value="${date_period}">
                                            </label>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (Sensor)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number pm25ValueSensor" value="${pm25}">
                                            </label>
                                            <ul class="pm25ValueSensorError"></ul>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (HVAS)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number pm25ValueSample" value="${pm25}">
                                            </label>
                                            <ul class="pm25ValueSampleError"></ul>
                                        </div>
                                    </div>
                                `)
                                //endregion

                                //region PM 10
                                bodyDataPM10.push(`
                                    <div class="grid grid-cols-3 gap-4 bg-gray-50 px-4 py-4 mb-2 rounded-md">
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                                Date
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control pm10Date" disabled value="${date_period}">
                                            </label>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (Sensor)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number pm10ValueSensor" disabled value="${pm10}">
                                            </label>
                                            <ul class="pm25ValueSensorError"></ul>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (HVAS)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number pm10ValueSample">
                                            </label>
                                            <ul class="pm10ValueSampleError"></ul>
                                        </div>
                                    </div>
                                `)
                                //endregion

                                //region TSP
                                bodyDataTSP.push(`
                                    <div class="grid grid-cols-3 gap-4 bg-gray-50 px-4 py-4 mb-2 rounded-md">
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-[rgb(0,124,255)] mr-2"></div>
                                                Date
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control tspDate" disabled value="${date_period}">
                                            </label>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (Sensor)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number tspValueSensor" disabled value="${tsp}">
                                            </label>
                                            <ul class="pm25ValueSensorError"></ul>
                                        </div>
                                        <div class="form-group !mb-0">
                                            <label>
                                                <div class="w-[7px] bg-gray-400 mr-2"></div>
                                                Value (HVAS)
                                            </label>
                                            <label class="form-group-control">
                                                <input class="form-control number tspValueSample">
                                            </label>
                                            <ul class="tspValueSampleError"></ul>
                                        </div>
                                    </div>
                                `)
                                //endregion
                            })

                            pm25Body.innerHTML = bodyDataPM25.join('\n')
                            pm10Body.innerHTML = bodyDataPM10.join('\n')
                            tspBody.innerHTML = bodyDataTSP.join('\n')

                            const number = document.querySelectorAll('.number')
                            if (number !== null) {
                                number.forEach((elm) => {
                                    ($(elm) as any).inputmask("decimal", {
                                        min: 0,
                                        radixPoint: ".",
                                        autoGroup: true,
                                        groupSeparator: ",",
                                        groupSize: 3,
                                        autoUnmask: true,
                                        removeMaskOnSubmit: true
                                    })
                                })
                            }

                            if (calculateCalibrationPM25) {
                                calculateCalibrationPM25.addEventListener('click', () => {
                                    const pm25Calibrate = modalForm.querySelectorAll('.pm25Calibrate')
                                    if (pm25Calibrate) {
                                        let XSum = 0
                                        let YSum = 0
                                        pm25Calibrate.forEach((elm) => {
                                            const pm25ValueSensor: HTMLInputElement = elm.querySelector('.pm25ValueSensor')
                                            const pm25ValueSample: HTMLInputElement = elm.querySelector('.pm25ValueSample')
                                            XSum += parseFloat(pm25ValueSensor.value)
                                            YSum += parseFloat(pm25ValueSample.value)
                                        })


                                        const X = parseFloat(numberFormat({maximumFractionDigits: 2}).format(XSum / pm25Calibrate.length));
                                        const Y = parseFloat(numberFormat({maximumFractionDigits: 2}).format(YSum / pm25Calibrate.length));

                                        let pem = 0
                                        let pen = 0
                                        pm25Calibrate.forEach((elm) => {
                                            const pm25ValueSensor: HTMLInputElement = elm.querySelector('.pm25ValueSensor')
                                            const pm25ValueSample: HTMLInputElement = elm.querySelector('.pm25ValueSample')

                                            pem += (parseFloat(pm25ValueSensor.value) - X) * (parseFloat(pm25ValueSample.value) - Y)
                                            pen += Math.pow((parseFloat(pm25ValueSensor.value) - X), 2)
                                        })

                                        const m = parseFloat(numberFormat({maximumFractionDigits: 2}).format((pem / pen)))
                                        const intercept = (Y - (m * X))

                                        pm25Kemiringan.value = `${numberFormat({
                                            maximumFractionDigits: 2,
                                        }).format(m / 144)}`

                                        pm25Intercept.value = `${numberFormat({
                                            maximumFractionDigits: 2,
                                        }).format(intercept / 144)}`
                                    }
                                })
                            }
                        }
                    }
                })
            })
        })
    }

})
