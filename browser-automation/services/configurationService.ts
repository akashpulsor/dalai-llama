import * as config from 'config';
import { logger } from '../utils/logger';

class ConfigurationService {
    private configuration: config.IConfig;
    private isLoaded: boolean = false;

    constructor() {
        this.configuration = config;
    }

    public async loadConfig(): Promise<void> {
        if (!this.isLoaded) {
            try {
                this.isLoaded = true;
                logger.info('Configuration loaded.');
            } catch (error) {
                logger.error('Failed to load configuration:', error);
                throw error;
            }
        }
    }

    public get<T>(key: string, defaultValue?: T): T {
        if (!this.isLoaded) {
            logger.warn(
                `Configuration not loaded. Attempting to retrieve key "${key}" before loading. Returning defaultValue:`,
                defaultValue
            );
            return this.configuration.get(key) ?? defaultValue;
        }
        return this.configuration.get(key) ?? defaultValue;
    }
}

export const configurationService = new ConfigurationService();