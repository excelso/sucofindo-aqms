document.addEventListener('DOMContentLoaded', function () {

    // Define types
    interface Shift {
        nama_shift: string;
        is_repeat: boolean;
        repeat_until: number;
    }

    interface Employee {
        nama_karyawan: string;
        effective_date: string;
        shift_schedule: Shift[];
    }

    // Data karyawan dan shift
    const employeeData: Employee[] = [
        {
            nama_karyawan: "Rendi Raharjo",
            effective_date: "2024-10-07",
            shift_schedule: [
                { nama_shift: "Normal", is_repeat: true, repeat_until: 5 },
                { nama_shift: "Libur", is_repeat: true, repeat_until: 2 }
            ]
        },
        {
            nama_karyawan: "Widi Widayat",
            effective_date: "2024-10-07",
            shift_schedule: [
                { nama_shift: "Normal", is_repeat: true, repeat_until: 5 },
                { nama_shift: "Libur", is_repeat: true, repeat_until: 2 }
            ]
        },
        {
            nama_karyawan: "Rahmat Haitami",
            effective_date: "2024-10-14",
            shift_schedule: [
                { nama_shift: "Normal", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Normal", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Normal", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Normal", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Normal", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Libur", is_repeat: false, repeat_until: 1 },
                { nama_shift: "Libur", is_repeat: false, repeat_until: 1 }
            ]
        }
    ];

    // Fungsi untuk mendapatkan tanggal dalam format "DD MMM YYYY"
    function formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        return date.toLocaleDateString('id-ID', options);
    }

    // Fungsi untuk menghasilkan array tanggal
    function generateDates(startDate: Date, count: number): Date[] {
        const dates: Date[] = [];
        for (let i = 0; i < count; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    // Fungsi untuk menghasilkan array shift untuk satu karyawan
    function generateShifts(employee: Employee, startDate: Date, count: number): string[] {
        const shifts: string[] = [];
        const effectiveDate = new Date(employee.effective_date);
        let currentDate = new Date(startDate);
        let shiftIndex = 0;
        let daysInCurrentShift = 0;

        for (let i = 0; i < count; i++) {
            if (currentDate < effectiveDate) {
                shifts.push('-');
            } else {
                const daysSinceEffective = Math.floor((currentDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
                const totalCycleDays = employee.shift_schedule.reduce((sum, shift) => sum + shift.repeat_until, 0);
                const dayInCycle = daysSinceEffective % totalCycleDays;

                let accumulatedDays = 0;
                for (let j = 0; j < employee.shift_schedule.length; j++) {
                    accumulatedDays += employee.shift_schedule[j].repeat_until;
                    if (dayInCycle < accumulatedDays) {
                        shiftIndex = j;
                        break;
                    }
                }

                shifts.push(employee.shift_schedule[shiftIndex].nama_shift);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return shifts;
    }

    // Fungsi untuk memperbarui tabel
    function updateTable(startDate: Date): void {
        const table = document.getElementById('table1') as HTMLTableElement;
        if (!table) return;

        table.innerHTML = ''; // Clear existing table

        // Create header row
        const headerRow = table.insertRow();
        headerRow.insertCell().textContent = 'Nama Karyawan';
        const dates = generateDates(startDate, 7);
        dates.forEach(date => {
            const cell = headerRow.insertCell();
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            cell.innerHTML = `${dayName}<br>${dateStr}`;
            cell.style.textAlign = 'center';
        });

        // Create data rows
        employeeData.forEach(employee => {
            const dataRow = table.insertRow();
            dataRow.insertCell().textContent = employee.nama_karyawan;
            const shifts = generateShifts(employee, startDate, 7);
            shifts.forEach(shift => {
                const cell = dataRow.insertCell();
                cell.textContent = shift;
                cell.style.textAlign = 'center';
                // Tambahkan warna latar belakang berdasarkan jenis shift
                // if (shift === 'Normal') {
                //     cell.style.backgroundColor = '#E6F7FF'; // Biru muda untuk shift Normal
                // } else if (shift === 'Libur') {
                //     cell.style.backgroundColor = '#FFF2E6'; // Oranye muda untuk Libur
                // }
            });
        });
    }

    // Inisialisasi tanggal awal
    let currentDate = new Date("2024-10-13");

    // Event listener untuk tombol Prev
    const prevButton = document.querySelector('.btnPrev') as HTMLElement;
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() - 7);
            updateTable(currentDate);
        });
    }

    // Event listener untuk tombol Next
    const nextButton = document.querySelector('.btnNext') as HTMLElement;
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() + 7);
            updateTable(currentDate);
        });
    }

    // Inisialisasi tabel
    updateTable(currentDate);

})
