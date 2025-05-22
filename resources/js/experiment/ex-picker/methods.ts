import {ExPicker} from "./expicker";
import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";

declare module './expicker' {
    interface ExPicker {
        setOption(options: ExPickerInterfaces): void
    }
}

ExPicker.prototype.setOption = function (options: ExPickerInterfaces) {
    // delete options.element
    this.options = {...this.options, ...options}
}
