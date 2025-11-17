import {ExBox} from "@/js/experiment/ex-box";
import {ExBoxOptionData} from "@/js/experiment/ex-box/interfaces";
import {getMetaContent} from "@/js/plugins/functions";

// Types and interfaces
interface SiteData {
    item: string;
}

export default class DataPlatformsIndustriModel {
    private readonly elmPlatId: HTMLSelectElement | HTMLInputElement;
    private readonly elmParaId: HTMLSelectElement;
    private readonly elmParaIdChoice: ExBox;
    private readonly options: Required<{
        csrfToken: string;
        useDefaultOption?: boolean;
    }>;
    private selectedValue: string = '';
    private cachedData: Map<string, ExBoxOptionData[]> = new Map();
    private isLoading: boolean = false;

    /**
     * Creates an instance of Site
     * @param elmPlatId - Company select/input element
     * @param elmParaId - Site select element
     * @param options - Configuration options
     */
    constructor(
            elmPlatId?: HTMLSelectElement | HTMLInputElement,
            elmParaId?: HTMLSelectElement,
            options?: {
                csrfToken?: string;
                useDefaultOption?: boolean;
            }
    ) {
        this.elmPlatId = elmPlatId ?? document.querySelector('.platformId');
        this.elmParaId = elmParaId ?? document.querySelector('.parameterId');
        this.elmParaIdChoice = new ExBox(this.elmParaId);
        this.options = {
            csrfToken: options?.csrfToken ?? getMetaContent('csrf-token'),
            useDefaultOption: options?.useDefaultOption ?? true
        };

        if (!this.elmPlatId || !this.elmParaId) {
            throw new Error('Required elements not found');
        }

        this.initialize();
        this.setupEventListeners();
    }

    /**
     * Initializes the component with any pre-selected values
     */
    private async initialize(): Promise<void> {
        try {
            const customerSelected = this.getCompanySelected();
            if (customerSelected) {
                await this.loadAndDisplaySite(customerSelected);

                const siteSelected = this.elmParaId.getAttribute('data-selected');
                if (siteSelected) {
                    this.setSelectedValue(siteSelected);
                }
            }
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Sets up event listeners for the component
     */
    private setupEventListeners(): void {
        this.elmPlatId.addEventListener('change', this.handleCompanyChange.bind(this));
    }

    /**
     * Handles unit selection changes
     */
    private async handleCompanyChange(event: Event): Promise<void> {
        try {
            const target = event.target as HTMLSelectElement | HTMLInputElement;
            const platSelectedId = target.value;

            this.resetSiteSelection();

            if (platSelectedId) {
                await this.loadAndDisplaySite(platSelectedId);
                if (this.selectedValue) {
                    this.setSelectedValue(this.selectedValue);
                }
            }
        } catch (error) {
            this.handleError('Failed to handle unit change', error);
        }
    }

    /**
     * Loads and displays site data for a given unit
     */
    private async loadAndDisplaySite(platformId: string): Promise<void> {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const data = await this.getSiteData(platformId);
            this.displaySiteData(data);

            // Ensure selected value is set after data is displayed
            if (this.selectedValue) {
                this.elmParaIdChoice.setSelected(this.selectedValue);
            }
        } catch (error) {
            this.handleError('Failed to load site data', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetches site data from the server or cache
     */
    private async getSiteData(platformId: string): Promise<ExBoxOptionData[]> {
        const cachedData = this.cachedData.get(platformId);
        if (cachedData) return cachedData;

        const data = await this.fetchSiteData(platformId);
        this.cachedData.set(platformId, data);
        return data;
    }

    /**
     * Fetches site data from the server
     */
    private async fetchSiteData(platformId: string): Promise<ExBoxOptionData[]> {
        const response = await fetch(`/sparing/master/platform/data-platform-by-industri?platform_id=${platformId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': this.options.csrfToken,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const {status} = response
        const {message, data} = await response.json();

        if (status !== 200) {
            throw new Error(message || 'Failed to fetch site data');
        }

        return this.transformSiteData(data);
    }

    /**
     * Transforms raw site data into ExBox option format
     */
    private transformSiteData(data: any[]): ExBoxOptionData[] {
        const defaultOption: ExBoxOptionData = {
            value: '',
            label: '...',
            additional: '',
            infos: ''
        };
        if (!data.length) return [defaultOption];
        
        if (this.options.useDefaultOption) {
            if (!data.length) return [defaultOption];
            return [
                defaultOption,
                ...data.map((item) => ({
                    value: item,
                    label: item,
                    additional: '',
                    infos: ''
                }))
            ];
        } else {
            return [
                ...data.map((item) => ({
                    value: item,
                    label: item,
                    additional: '',
                    infos: ''
                }))
            ];
        }
    }

    /**
     * Displays site data in the select element
     */
    private displaySiteData(data: ExBoxOptionData[]): void {
        this.elmParaIdChoice.createOptionDataElement(data);
    }

    /**
     * Gets the selected unit value
     */
    private getCompanySelected(): string | null {
        if (this.elmPlatId instanceof HTMLSelectElement) {
            return this.elmPlatId.value || this.elmPlatId.getAttribute('data-selected');
        }
        return this.elmPlatId.value;
    }

    /**
     * Resets the site selection
     */
    private resetSiteSelection(): void {
        this.elmParaIdChoice.clearData();
        this.selectedValue = '';
    }

    /**
     * Handles errors in the component
     */
    private handleError(context: string, error: unknown): void {
        console.error(`${context}:`, error);
    }

    // Public methods

    /**
     * Sets the selected site value and updates the display
     */
    public async setSelectedAndUpdate(value: string): Promise<void> {
        try {
            this.selectedValue = value;
            const platSelectedId = this.getCompanySelected();
            if (!platSelectedId) return;

            await this.loadAndDisplaySite(platSelectedId);
        } catch (error) {
            this.handleError('Failed to set selected value', error);
        }
    }

    /**
     * Sets the selected value without updating the display
     */
    public setSelectedValue(value: string): void {
        this.selectedValue = value;
        this.elmParaIdChoice.setSelected(value);
    }

    /**
     * Clears all data and selections
     */
    public clearAll(): void {
        this.resetSiteSelection();
        this.cachedData.clear();
    }

    /**
     * Gets the current selected value
     */
    public getSelectedValue(): string {
        return this.selectedValue;
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use setSelectedAndUpdate instead
     */
    public selectedData(platSelectedId: string, paraId: string): void {
        this.loadAndDisplaySite(platSelectedId).then(() => {
            this.setSelectedValue(paraId);
        });
    }
}
