import i18next from "i18next";
import id from '../../../lang/id.json'

export const transInit = () => {
    i18next.init({
        lng: document.documentElement.lang,
        // pluralSeparator: '|',
        resources: {
            id: {
                translation: id
            }
        },
        interpolation: {
            escapeValue: false
        },
        debug: false
    }).then(null)

    const trans = (key: string, options?: any) => {
        return i18next.t(key, options)
    }

    return {
        trans
    }
}
