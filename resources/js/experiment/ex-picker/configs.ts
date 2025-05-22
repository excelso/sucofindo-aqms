export class Configs {
    protected formatDate(date: Date, locale: string, format: string): string {
        const formatOptions = {
            'yyyy': { year: 'numeric' },
            'yy': { year: '2-digit' },
            'mmmm': { month: 'long' },
            'mmm': { month: 'short' },
            'mm': { month: '2-digit' },
            'dd': { day: '2-digit' },
            'HH': { hour: '2-digit', hour12: false },
            'MM': { minute: '2-digit' },
            'SS': { second: '2-digit' }
        };

        return format.replace(/yyyy|yy|mmmm|mmm|mm|dd|HH|MM|SS/gi, (match) => {
            const options = formatOptions[match];
            const y = date.getFullYear()
            const m = date.getMonth() - 1
            const d = date.getDate()
            return new Date(y, m, d).toLocaleString(locale, options);
        });
    }

    protected getElementParent(element: HTMLElement) {
        if (!element) {
            return null;
        }

        const isOverflowX = (el: HTMLElement) => {
            const style = window.getComputedStyle(el);
            const overflowX = style.getPropertyValue('overflow-y');
            return (overflowX === 'auto' || overflowX === 'scroll');
        };

        if (isOverflowX(element)) {
            return element;
        }

        return this.getElementParent(element.parentElement);
    }

    protected parseDateString(dateString: string): { year: number, month: number, day: number } | null {
        // Menghapus semua karakter non-angka dan non-spasi
        const cleanedString = dateString.replace(/[^\d\s]/g, ' ');

        // Memisahkan string menjadi array angka
        const parts = cleanedString.split(/\s+/).filter(part => part !== '');

        if (parts.length !== 3) {
            return null; // Invalid format
        }

        let year: number, month: number, day: number;

        // Fungsi untuk menentukan apakah sebuah angka mungkin merupakan bulan
        const isMonth = (num: number) => num >= 1 && num <= 12;

        // Mencoba mengidentifikasi tahun (angka 4 digit)
        const yearIndex = parts.findIndex(part => part.length === 4);

        if (yearIndex !== -1) {
            year = parseInt(parts[yearIndex]);
            const remainingParts = parts.filter((_, index) => index !== yearIndex).map(part => parseInt(part));

            // Menentukan mana yang bulan dan mana yang hari
            if (isMonth(remainingParts[0]) && !isMonth(remainingParts[1])) {
                [month, day] = remainingParts;
            } else if (!isMonth(remainingParts[0]) && isMonth(remainingParts[1])) {
                [day, month] = remainingParts;
            } else {
                // Jika keduanya bisa jadi bulan atau keduanya tidak bisa, asumsikan format bulan-hari
                [month, day] = remainingParts;
            }
        } else {
            // Jika tidak ada angka 4 digit, coba tentukan berdasarkan nilai
            const numParts = parts.map(part => parseInt(part));

            if (isMonth(numParts[0])) {
                [month, day, year] = numParts;
            } else if (isMonth(numParts[1])) {
                [day, month, year] = numParts;
            } else {
                // Jika tidak ada yang jelas merupakan bulan, asumsikan format hari-bulan-tahun
                [day, month, year] = numParts;
            }

            // Jika tahun hanya 2 digit, tambahkan 2000
            if (year < 100) {
                year += 2000;
            }
        }

        // Validasi final
        if (!isMonth(month) || day < 1 || day > 31) {
            return null; // Invalid date
        }

        return {year, month, day};
    }
}
