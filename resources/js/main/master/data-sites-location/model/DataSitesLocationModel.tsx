import {ExBox} from "@/js/experiment/ex-box";
import {ExBoxOptionData} from "@/js/experiment/ex-box/interfaces";

// Types and interfaces
interface SiteLocationData {
    id: string;
    location_name: string;
}

interface SiteLocationOptions {
    csrfToken?: string | null;
}

/**
 * DataSitesLocationModel Class
 * Manages site location data selection and display within a site context
 */
export default class DataSitesLocationModel {
    private readonly elmSiteId: HTMLSelectElement | HTMLInputElement;
    private readonly elmLocation: HTMLSelectElement;
    private readonly elmLocationChoice: ExBox;
    private readonly options: Required<SiteLocationOptions>;
    private selectedValue: string = '';
    private cachedData: Map<string, ExBoxOptionData[]> = new Map();
    private isLoading: boolean = false;

    /**
     * Creates an instance of DataSitesLocationModel
     * @param elmSiteId - Site select/input element
     * @param elmLocation - Location select element
     * @param options - Configuration options
     */
    constructor(
            elmSiteId: HTMLSelectElement | HTMLInputElement,
            elmLocation: HTMLSelectElement,
            options: SiteLocationOptions
    ) {
        this.elmSiteId = elmSiteId;
        this.elmLocation = elmLocation;
        this.elmLocationChoice = new ExBox(this.elmLocation);
        this.options = {
            csrfToken: options.csrfToken ?? null
        };

        this.initialize();
        this.setupEventListeners();
    }

    /**
     * Initializes the component with any pre-selected values
     */
    private async initialize(): Promise<void> {
        try {
            const siteSelected = this.getSiteSelected();
            if (siteSelected) {
                await this.loadAndDisplayLocations(siteSelected);

                const locationSelected = this.elmLocation.getAttribute('data-selected');
                if (locationSelected) {
                    this.setSelectedValue(locationSelected);
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
        this.elmSiteId.addEventListener('change', this.handleSiteChange.bind(this));
    }

    /**
     * Handles site selection changes
     */
    private async handleSiteChange(event: Event): Promise<void> {
        try {
            const target = event.target as HTMLSelectElement | HTMLInputElement;
            const siteId = target.value;

            this.resetLocationSelection();

            if (siteId) {
                await this.loadAndDisplayLocations(siteId);
                if (this.selectedValue) {
                    this.setSelectedValue(this.selectedValue);
                }
            }
        } catch (error) {
            this.handleError('Failed to handle site change', error);
        }
    }

    /**
     * Loads and displays location data for a given site
     */
    private async loadAndDisplayLocations(siteId: string): Promise<void> {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const data = await this.getSiteLocationData(siteId);
            this.displayLocationData(data);
            // Pastikan selected value di-set setelah data di-display
            if (this.selectedValue) {
                this.elmLocationChoice.setSelected(this.selectedValue);
            }
        } catch (error) {
            this.handleError('Failed to load location data', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetches location data from the server or cache
     */
    private async getSiteLocationData(siteId: string): Promise<ExBoxOptionData[]> {
        const cachedData = this.cachedData.get(siteId);
        if (cachedData) return cachedData;

        const data = await this.fetchSiteLocationData(siteId);
        this.cachedData.set(siteId, data);
        return data;
    }

    /**
     * Fetches location data from the server
     */
    private async fetchSiteLocationData(siteId: string): Promise<ExBoxOptionData[]> {
        const response = await fetch(
                `/aqms/master/sites-location/data-location?site_id=${siteId}`,
                {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': this.options.csrfToken || '',
                        'Content-Type': 'application/json',
                    },
                }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch location data');
        }

        const {data} = await response.json();
        return this.transformSiteLocationData(data);
    }

    /**
     * Transforms raw location data into ExBox option format
     */
    private transformSiteLocationData(data: SiteLocationData[]): ExBoxOptionData[] {
        const defaultOption: ExBoxOptionData = {
            value: '',
            label: '...',
        };

        if (!data.length) return [defaultOption];

        return [
            defaultOption,
            ...data.map(({id, location_name}) => ({
                value: id,
                label: location_name,
            }))
        ];
    }

    /**
     * Displays location data in the select element
     */
    private displayLocationData(data: ExBoxOptionData[]): void {
        this.elmLocationChoice.createOptionDataElement(data);
    }

    /**
     * Gets the selected site value
     */
    private getSiteSelected(): string | null {
        if (this.elmSiteId instanceof HTMLSelectElement) {
            return this.elmSiteId.value || this.elmSiteId.getAttribute('data-selected');
        }
        return this.elmSiteId.value;
    }

    /**
     * Resets the location selection
     */
    private resetLocationSelection(): void {
        this.elmLocationChoice.clearData();
        this.selectedValue = '';
    }

    /**
     * Handles errors in the component
     */
    private handleError(context: string, error: unknown): void {
        console.error(`${context}:`, error);
        // You can implement custom error handling here
        // For example, showing a toast notification or alert
    }

    // Public methods

    /**
     * Sets the selected location value and updates the display
     */
    public async setSelectedAndUpdate(value: string): Promise<void> {
        try {
            this.selectedValue = value;
            const siteId = this.getSiteSelected();
            if (!siteId) return;

            await this.loadAndDisplayLocations(siteId);
        } catch (error) {
            this.handleError('Failed to set selected value', error);
        }
    }

    /**
     * Sets the selected value without updating the display
     */
    public setSelectedValue(value: string): void {
        this.selectedValue = value;
        this.elmLocationChoice.setSelected(value);
    }

    /**
     * Clears all data and selections
     */
    public clearAll(): void {
        this.resetLocationSelection();
        this.cachedData.clear();
    }

    /**
     * Gets the current selected value
     */
    public getSelectedValue(): string {
        return this.selectedValue;
    }

    /**
     * @deprecated Use setSelectedValue instead
     * Legacy method for backward compatibility
     */
    public selectedData(siteId: string, locationId: string): void {
        this.loadAndDisplayLocations(siteId).then(() => {
            this.setSelectedValue(locationId);
        });
    }
}
