import * as screens from '../../../screen.json';
const config = screens.default;

export const getDeviceConfig = (width) => {
    let media = '';
    for (const breakpoint of Object.keys(config)) {
        const {min, max} = config[breakpoint];
        const minWidth = parseFloat(min.slice(0, min.indexOf('px')));
        const maxWidth = typeof max !== 'undefined' ? parseFloat(max.slice(0, max.indexOf('px'))) : 0;

        if (width >= minWidth && width <= maxWidth) {
            media = breakpoint;
        } else if (width > minWidth) {
            media = breakpoint;
        }
    }

    return media;
}
