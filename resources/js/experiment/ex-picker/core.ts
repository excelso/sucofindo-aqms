import {EventEmitter} from "events";
import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";

export class ExCore extends EventEmitter {

    protected ui: HTMLElement
    protected options: ExPickerInterfaces = {
        element: null,
        startDate: null,
        dateFormat: 'yyyy-mm-dd',
        onClick: null
    }

    constructor(options: ExPickerInterfaces) {
        super()

        this.options = {
            ...this.options,
            ...options.element.dataset
        }
    }
}
