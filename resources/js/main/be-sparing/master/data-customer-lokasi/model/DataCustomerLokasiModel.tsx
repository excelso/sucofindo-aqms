import {ExBox} from "@/js/experiment/ex-box";
import {ExBoxOptionData} from "@/js/experiment/ex-box/interfaces";
import {getMetaContent} from "@/js/plugins/functions";

// Types and interfaces
interface SiteData {
    id: string;
    nama_lokasi: string;
}

export default class DataCustomerLokasiModel {
    private readonly elmCustomerId: HTMLSelectElement | HTMLInputElement;
    private readonly elmCustomerLokasi: HTMLSelectElement;
    private readonly elmCustomerLokasiChoice: ExBox;
    private readonly options: Required<{
        csrfToken: string;
    }>;
    private selectedValue: string = '';
    private cachedData: Map<string, ExBoxOptionData[]> = new Map();
    private isLoading: boolean = false;

    /**
     * Creates an instance of Site
     * @param elmCustomerId - Company select/input element
     * @param elmCustomerLokasi - Site select element
     * @param options - Configuration options
     */
    constructor(
            elmCustomerId?: HTMLSelectElement | HTMLInputElement,
            elmCustomerLokasi?: HTMLSelectElement,
            options?: {
                csrfToken?: string;
            }
    ) {
        this.elmCustomerId = elmCustomerId ?? document.querySelector('.customerId');
        this.elmCustomerLokasi = elmCustomerLokasi ?? document.querySelector('.companySiteId');
        this.elmCustomerLokasiChoice = new ExBox(this.elmCustomerLokasi);
        this.options = {
            csrfToken: options?.csrfToken ?? getMetaContent('csrf-token')
        };

        if (!this.elmCustomerId || !this.elmCustomerLokasi) {
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
            const unitSelected = this.getCompanySelected();
            if (unitSelected) {
                await this.loadAndDisplaySite(unitSelected);

                const siteSelected = this.elmCustomerLokasi.getAttribute('data-selected');
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
        this.elmCustomerId.addEventListener('change', this.handleCompanyChange.bind(this));
    }

    /**
     * Handles unit selection changes
     */
    private async handleCompanyChange(event: Event): Promise<void> {
        try {
            const target = event.target as HTMLSelectElement | HTMLInputElement;
            const unitId = target.value;

            this.resetSiteSelection();

            if (unitId) {
                await this.loadAndDisplaySite(unitId);
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
    private async loadAndDisplaySite(unitId: string): Promise<void> {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const data = await this.getSiteData(unitId);
            this.displaySiteData(data);

            // Ensure selected value is set after data is displayed
            if (this.selectedValue) {
                this.elmCustomerLokasiChoice.setSelected(this.selectedValue);
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
    private async getSiteData(unitId: string): Promise<ExBoxOptionData[]> {
        const cachedData = this.cachedData.get(unitId);
        if (cachedData) return cachedData;

        const data = await this.fetchSiteData(unitId);
        this.cachedData.set(unitId, data);
        return data;
    }

    /**
     * Fetches site data from the server
     */
    private async fetchSiteData(customerId: string): Promise<ExBoxOptionData[]> {
        const response = await fetch(`/sparing/master/lokasi/data-lokasi-by-customer?customer_id=${customerId}`, {
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
    private transformSiteData(data: SiteData[]): ExBoxOptionData[] {
        const defaultOption: ExBoxOptionData = {
            value: '',
            label: '...',
            additional: '',
            infos: ''
        };

        if (!data.length) return [defaultOption];

        return [
            defaultOption,
            ...data.map(({id, nama_lokasi}) => ({
                value: id,
                label: nama_lokasi,
                additional: '',
                infos: ''
            }))
        ];
    }

    /**
     * Displays site data in the select element
     */
    private displaySiteData(data: ExBoxOptionData[]): void {
        this.elmCustomerLokasiChoice.createOptionDataElement(data);
    }

    /**
     * Gets the selected unit value
     */
    private getCompanySelected(): string | null {
        if (this.elmCustomerId instanceof HTMLSelectElement) {
            return this.elmCustomerId.value || this.elmCustomerId.getAttribute('data-selected');
        }
        return this.elmCustomerId.value;
    }

    /**
     * Resets the site selection
     */
    private resetSiteSelection(): void {
        this.elmCustomerLokasiChoice.clearData();
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
            const unitId = this.getCompanySelected();
            if (!unitId) return;

            await this.loadAndDisplaySite(unitId);
        } catch (error) {
            this.handleError('Failed to set selected value', error);
        }
    }

    /**
     * Sets the selected value without updating the display
     */
    public setSelectedValue(value: string): void {
        this.selectedValue = value;
        this.elmCustomerLokasiChoice.setSelected(value);
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
    public selectedData(unitId: string, siteId: string): void {
        this.loadAndDisplaySite(unitId).then(() => {
            this.setSelectedValue(siteId);
        });
    }
}
