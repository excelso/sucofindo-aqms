import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import VideoStreamHandler from "@/js/plugins/videoStreamHandler";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const dataTables: NodeListOf<HTMLElement> = document.querySelectorAll('.data-tables')
    const btnSearch = document.querySelector('.btnSearch')
    const modalPencarian = document.querySelector('.modalPencarian')

    const modalCctv: HTMLElement = document.querySelector('.modalCctv')
    const modalBody: HTMLElement = modalCctv.querySelector('.modal-body')

    const videoHandler = new VideoStreamHandler({
        autoplay: true,
        controls: true,
        muted: true,
        maxHeight: '80vh',
        retryAttempts: 5
    });

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalPencarian) {
                closeModalDialog(modalPencarian, () => {

                })
            }

            if (modalCctv) {
                closeModalDialog(modalCctv, () => {
                    videoHandler.destroy();
                })
            }
        })
    })
    //endregion

    //region Handle Pencarian
    if (btnSearch !== null) {
        btnSearch.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                modalPencarian.addEventListener('keypress', function (ev) {
                    // @ts-ignore
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
                    win.location = `/reports/logs-parameter?${text_result.join('&')}`
                })
            })
        })
    }
    //endregion

    if (dataTables) {
        dataTables.forEach((elm: Element) => {
            const btnCCTV: HTMLLinkElement = elm.querySelector('.btnCCTV')
            const dataUid = elm.getAttribute('data-uid')
            if (btnCCTV) {
                btnCCTV.addEventListener('click', function () {
                    showModalDialog(modalCctv, `
                        <div class="flex items-center">
                            <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${dataUid}
                        </div>
                    `, () => {
                        videoHandler.createVideoElement(modalBody, btnCCTV.getAttribute('data-href'));
                    })
                })
            }
        })
    }

})
