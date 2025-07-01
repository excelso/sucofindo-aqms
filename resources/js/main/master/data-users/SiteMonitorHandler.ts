export class SiteMonitorHandler {
    private container: HTMLElement;
    private searchInput: HTMLInputElement;
    private checkAllCheckbox: HTMLInputElement;
    private tableBody: HTMLElement;
    private allRows: NodeListOf<HTMLTableRowElement>;

    constructor(containerSelector: HTMLElement) {
        this.container = containerSelector;
        if (!this.container) {
            throw new Error(`Container with selector "${containerSelector}" not found`);
        }

        this.initializeElements();
        this.bindEvents();
    }

    private initializeElements(): void {
        this.searchInput = this.container.querySelector('.searchInput') as HTMLInputElement;
        this.checkAllCheckbox = this.container.querySelector('.checkAll') as HTMLInputElement;
        this.tableBody = this.container.querySelector('.tableSite tbody') as HTMLElement;
        this.allRows = this.container.querySelectorAll('.tableSite tbody tr');

        if (!this.searchInput || !this.checkAllCheckbox || !this.tableBody) {
            throw new Error('Required elements not found');
        }
    }

    private bindEvents(): void {
        // Search functionality
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));

        // Check all functionality
        this.checkAllCheckbox.addEventListener('change', this.handleCheckAll.bind(this));

        // Company checkboxes
        this.bindCompanyCheckboxes();

        // Site checkboxes
        this.bindSiteCheckboxes();

        // Platform checkboxes
        this.bindPlatformCheckboxes();

        // Type logger checkboxes
        this.bindTypeLoggerCheckboxes();
    }

    private bindCompanyCheckboxes(): void {
        const companyCheckboxes = this.container.querySelectorAll('.checkCustomer') as NodeListOf<HTMLInputElement>;

        companyCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                const companyId = target.getAttribute('data-id');
                this.toggleCompanyChildren(companyId, target.checked);
                this.updateCheckAllState();
            });
        });
    }

    private bindSiteCheckboxes(): void {
        const siteCheckboxes = this.container.querySelectorAll('.checkSite') as NodeListOf<HTMLInputElement>;

        siteCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                const siteId = target.getAttribute('data-id');
                const parentCompanyId = target.getAttribute('data-parent');

                this.toggleSiteChildren(siteId, target.checked);
                this.updateParentCompanyState(parentCompanyId);
                this.updateCheckAllState();
            });
        });
    }

    private bindPlatformCheckboxes(): void {
        const platformCheckboxes = this.container.querySelectorAll('.checkPlatform') as NodeListOf<HTMLInputElement>;

        platformCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                const platformId = target.getAttribute('data-id');
                const parentSiteId = target.getAttribute('data-parent');

                this.togglePlatformChildren(platformId, target.checked);
                this.updateParentSiteState(parentSiteId);
                this.updateCheckAllState();
            });
        });
    }

    private bindTypeLoggerCheckboxes(): void {
        const typeLoggerCheckboxes = this.container.querySelectorAll('.typeLoggerIn, .typeLoggerRe') as NodeListOf<HTMLInputElement>;

        typeLoggerCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                const parentSiteId = target.getAttribute('data-parent-site');

                this.updateParentPlatformState(parentSiteId);
                this.updateCheckAllState();
            });
        });
    }

    private toggleCompanyChildren(companyId: string, isChecked: boolean): void {
        // Toggle all sites under this company
        const siteCheckboxes = this.container.querySelectorAll(`.checkSite[data-parent="${companyId}"]`) as NodeListOf<HTMLInputElement>;
        siteCheckboxes.forEach(siteCheckbox => {
            siteCheckbox.checked = isChecked;
            siteCheckbox.indeterminate = false;

            // Toggle all platforms under each site
            const siteId = siteCheckbox.getAttribute('data-id');
            this.toggleSiteChildren(siteId, isChecked);
        });
    }

    private toggleSiteChildren(siteId: string, isChecked: boolean): void {
        // Toggle all platforms under this site
        const platformCheckboxes = this.container.querySelectorAll(`.checkPlatform[data-parent="${siteId}"]`) as NodeListOf<HTMLInputElement>;
        platformCheckboxes.forEach(platformCheckbox => {
            platformCheckbox.checked = isChecked;
            platformCheckbox.indeterminate = false;

            // Toggle all type loggers under this platform
            const platformId = platformCheckbox.getAttribute('data-id');
            this.togglePlatformChildren(platformId, isChecked);
        });
    }

    private togglePlatformChildren(platformId: string, isChecked: boolean): void {
        // Toggle all type logger checkboxes that belong to this specific platform
        const typeLoggerCheckboxes = this.container.querySelectorAll(`.typeLoggerIn[data-platform-id="${platformId}"], .typeLoggerRe[data-platform-id="${platformId}"]`) as NodeListOf<HTMLInputElement>;

        typeLoggerCheckboxes.forEach(typeLoggerCheckbox => {
            typeLoggerCheckbox.checked = isChecked;
            typeLoggerCheckbox.indeterminate = false;
        });
    }

    private updateParentCompanyState(companyId: string): void {
        const companyCheckbox = this.container.querySelector(`.checkCustomer[data-id="${companyId}"]`) as HTMLInputElement;
        if (!companyCheckbox) return;

        const siteCheckboxes = this.container.querySelectorAll(`.checkSite[data-parent="${companyId}"]`) as NodeListOf<HTMLInputElement>;
        const checkedSites = Array.from(siteCheckboxes).filter(cb => cb.checked);
        const indeterminateSites = Array.from(siteCheckboxes).filter(cb => cb.indeterminate);

        if (checkedSites.length === siteCheckboxes.length) {
            companyCheckbox.checked = true;
            companyCheckbox.indeterminate = false;
        } else if (checkedSites.length > 0 || indeterminateSites.length > 0) {
            companyCheckbox.checked = false;
            companyCheckbox.indeterminate = true;
        } else {
            companyCheckbox.checked = false;
            companyCheckbox.indeterminate = false;
        }
    }

    private updateParentSiteState(siteId: string): void {
        const siteCheckbox = this.container.querySelector(`.checkSite[data-id="${siteId}"]`) as HTMLInputElement;
        if (!siteCheckbox) return;

        const platformCheckboxes = this.container.querySelectorAll(`.checkPlatform[data-parent="${siteId}"]`) as NodeListOf<HTMLInputElement>;
        const checkedPlatforms = Array.from(platformCheckboxes).filter(cb => cb.checked);
        const indeterminatePlatforms = Array.from(platformCheckboxes).filter(cb => cb.indeterminate);

        if (checkedPlatforms.length === platformCheckboxes.length) {
            siteCheckbox.checked = true;
            siteCheckbox.indeterminate = false;
        } else if (checkedPlatforms.length > 0 || indeterminatePlatforms.length > 0) {
            siteCheckbox.checked = false;
            siteCheckbox.indeterminate = true;
        } else {
            siteCheckbox.checked = false;
            siteCheckbox.indeterminate = false;
        }

        // Update parent company state
        const parentCompanyId = siteCheckbox.getAttribute('data-parent');
        this.updateParentCompanyState(parentCompanyId);
    }

    private updateParentPlatformState(siteId: string): void {
        // Find all platforms for this site
        const platformCheckboxes = this.container.querySelectorAll(`.checkPlatform[data-parent="${siteId}"]`) as NodeListOf<HTMLInputElement>;

        platformCheckboxes.forEach(platformCheckbox => {
            const platformId = platformCheckbox.getAttribute('data-id');

            // Get all type logger checkboxes for this specific platform
            const typeLoggerCheckboxes = this.container.querySelectorAll(`.typeLoggerIn[data-platform-id="${platformId}"], .typeLoggerRe[data-platform-id="${platformId}"]`) as NodeListOf<HTMLInputElement>;
            const checkedTypeLoggers = Array.from(typeLoggerCheckboxes).filter(cb => cb.checked);

            if (checkedTypeLoggers.length === typeLoggerCheckboxes.length && typeLoggerCheckboxes.length > 0) {
                platformCheckbox.checked = true;
                platformCheckbox.indeterminate = false;
            } else if (checkedTypeLoggers.length > 0) {
                platformCheckbox.checked = false;
                platformCheckbox.indeterminate = true;
            } else {
                platformCheckbox.checked = false;
                platformCheckbox.indeterminate = false;
            }
        });

        // Update parent site state
        this.updateParentSiteState(siteId);
    }

    private updateCheckAllState(): void {
        const allCheckboxes = this.container.querySelectorAll('input[type="checkbox"]:not(.checkAll)') as NodeListOf<HTMLInputElement>;
        const visibleCheckboxes = Array.from(allCheckboxes).filter(cb => {
            const row = cb.closest('tr');
            return row && !row.style.display.includes('none');
        });

        const checkedCheckboxes = visibleCheckboxes.filter(cb => cb.checked);

        if (checkedCheckboxes.length === visibleCheckboxes.length && visibleCheckboxes.length > 0) {
            this.checkAllCheckbox.checked = true;
            this.checkAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length > 0) {
            this.checkAllCheckbox.checked = false;
            this.checkAllCheckbox.indeterminate = true;
        } else {
            this.checkAllCheckbox.checked = false;
            this.checkAllCheckbox.indeterminate = false;
        }
    }

    private handleCheckAll(event: Event): void {
        const target = event.target as HTMLInputElement;
        const isChecked = target.checked;

        // Get all visible checkboxes
        const allCheckboxes = this.container.querySelectorAll('input[type="checkbox"]:not(.checkAll)') as NodeListOf<HTMLInputElement>;

        allCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row && !row.style.display.includes('none')) {
                checkbox.checked = isChecked;
                checkbox.indeterminate = false;
            }
        });
    }

    private handleSearch(event: Event): void {
        const target = event.target as HTMLInputElement;
        const searchTerm = target.value.toLowerCase().trim();

        this.allRows.forEach(row => {
            if (this.shouldShowRow(row, searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Update check all state after search
        this.updateCheckAllState();
    }

    private shouldShowRow(row: HTMLTableRowElement, searchTerm: string): boolean {
        if (!searchTerm) return true;

        // Get the text content from the second column (company/site/platform name)
        const nameCell = row.querySelector('td:nth-child(2)') as HTMLTableCellElement;
        if (!nameCell) return false;

        const nameText = nameCell.textContent?.toLowerCase().trim() || '';

        // Check if the search term matches this row directly
        if (nameText.includes(searchTerm)) {
            return true;
        }

        // If this is a child row (site/platform/type logger), check if parent matches
        const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
            // For sites, check if parent company matches
            if (checkbox.classList.contains('checkSite')) {
                const parentCompanyId = checkbox.getAttribute('data-parent');
                const companyRow = this.findCompanyRow(parentCompanyId);
                if (companyRow && this.getRowName(companyRow).toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }

            // For platforms, check if parent site or company matches
            if (checkbox.classList.contains('checkPlatform')) {
                const parentSiteId = checkbox.getAttribute('data-parent');
                const siteRow = this.findSiteRow(parentSiteId);
                if (siteRow && this.getRowName(siteRow).toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Also check parent company
                if (siteRow) {
                    const siteCheckbox = siteRow.querySelector('.checkSite') as HTMLInputElement;
                    if (siteCheckbox) {
                        const companyId = siteCheckbox.getAttribute('data-parent');
                        const companyRow = this.findCompanyRow(companyId);
                        if (companyRow && this.getRowName(companyRow).toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                    }
                }
            }

            // For type loggers, ALWAYS show if their parent platform matches
            if (checkbox.classList.contains('typeLoggerIn') || checkbox.classList.contains('typeLoggerRe')) {
                const platformId = checkbox.getAttribute('data-platform-id');
                const platformRow = this.findPlatformRow(platformId);

                // Check if parent platform name matches
                if (platformRow && this.getRowName(platformRow).toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Check if parent site name matches
                const parentSiteId = checkbox.getAttribute('data-parent-site');
                const siteRow = this.findSiteRow(parentSiteId);
                if (siteRow && this.getRowName(siteRow).toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Check if parent company name matches
                if (siteRow) {
                    const siteCheckbox = siteRow.querySelector('.checkSite') as HTMLInputElement;
                    if (siteCheckbox) {
                        const companyId = siteCheckbox.getAttribute('data-parent');
                        const companyRow = this.findCompanyRow(companyId);
                        if (companyRow && this.getRowName(companyRow).toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    private findPlatformRow(platformId: string): HTMLTableRowElement | null {
        const platformCheckbox = this.container.querySelector(`.checkPlatform[data-id="${platformId}"]`) as HTMLInputElement;
        return platformCheckbox ? platformCheckbox.closest('tr') as HTMLTableRowElement : null;
    }

    private findCompanyRow(companyId: string): HTMLTableRowElement | null {
        const companyCheckbox = this.container.querySelector(`.checkCustomer[data-id="${companyId}"]`) as HTMLInputElement;
        return companyCheckbox ? companyCheckbox.closest('tr') as HTMLTableRowElement : null;
    }

    private findSiteRow(siteId: string): HTMLTableRowElement | null {
        const siteCheckbox = this.container.querySelector(`.checkSite[data-id="${siteId}"]`) as HTMLInputElement;
        return siteCheckbox ? siteCheckbox.closest('tr') as HTMLTableRowElement : null;
    }

    private getRowName(row: HTMLTableRowElement): string {
        const nameCell = row.querySelector('td:nth-child(2)') as HTMLTableCellElement;
        return nameCell ? nameCell.textContent?.trim() || '' : '';
    }

    private checkTypeLogger(platformId: string, typeLogger: number): void {
        const typeLoggerClass = typeLogger === 1 ? '.typeLoggerIn' : '.typeLoggerRe';
        const checkbox = this.container.querySelector(`${typeLoggerClass}[data-platform-id="${platformId}"]`) as HTMLInputElement;

        if (checkbox) {
            checkbox.checked = true;
            checkbox.indeterminate = false;
            console.log(`Checked ${typeLoggerClass} for platform ${platformId}`);
        } else {
            console.warn(`Checkbox not found: ${typeLoggerClass}[data-platform-id="${platformId}"]`);
        }
    }

    private updateAllParentStates(): void {
        // Get all unique site IDs and update their parent states
        const siteIds = new Set<string>();
        const typeLoggerCheckboxes = this.container.querySelectorAll('.typeLoggerIn, .typeLoggerRe') as NodeListOf<HTMLInputElement>;

        typeLoggerCheckboxes.forEach(checkbox => {
            const siteId = checkbox.getAttribute('data-parent-site');
            if (siteId) {
                siteIds.add(siteId);
            }
        });

        // Update parent states for each site
        siteIds.forEach(siteId => {
            this.updateParentPlatformState(siteId);
        });

        // Update check all state
        this.updateCheckAllState();
    }

    public setPermissions(permissions: {platform_id: string, type_logger: number, is_active: boolean}[]): void {
        permissions.forEach(permission => {
            if (permission.is_active) {
                this.checkTypeLogger(permission.platform_id, permission.type_logger);
            }
        });

        // Update all parent states after setting permissions
        this.updateAllParentStates();
    }

    // Public methods for getting selected values
    public getSelectedCompanies(): string[] {
        const selectedCheckboxes = this.container.querySelectorAll('.checkCustomer:checked') as NodeListOf<HTMLInputElement>;
        return Array.from(selectedCheckboxes).map(cb => cb.value);
    }

    public getSelectedSites(): string[] {
        const selectedCheckboxes = this.container.querySelectorAll('.checkSite:checked') as NodeListOf<HTMLInputElement>;
        return Array.from(selectedCheckboxes).map(cb => cb.value);
    }

    public getSelectedPlatforms(): string[] {
        const selectedCheckboxes = this.container.querySelectorAll('.checkPlatform:checked') as NodeListOf<HTMLInputElement>;
        return Array.from(selectedCheckboxes).map(cb => cb.value);
    }

    public getSelectedTypeLoggers(): {type: string, value: string, platformId: string, platformUID: string}[] {
        const selectedCheckboxes = this.container.querySelectorAll('.typeLoggerIn:checked, .typeLoggerRe:checked') as NodeListOf<HTMLInputElement>;
        return Array.from(selectedCheckboxes).map(cb => ({
            type: cb.classList.contains('typeLoggerIn') ? '1' : '2',
            value: cb.value,
            platformId: cb.getAttribute('data-platform-id') || '',
            platformUID: cb.getAttribute('data-platform-uid') || '',
        }));
    }

    public getAllSelectedData(): {
        companies: string[];
        sites: string[];
        platforms: string[];
        typeLoggers: {type: string, value: string, platformId: string, platformUID: string}[];
    } {
        return {
            companies: this.getSelectedCompanies(),
            sites: this.getSelectedSites(),
            platforms: this.getSelectedPlatforms(),
            typeLoggers: this.getSelectedTypeLoggers()
        };
    }

    public clearAllSelections(): void {
        const allCheckboxes = this.container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        });
    }
}
