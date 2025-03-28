import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { logger } from './logger';

let browserInstance: Browser | null = null;

export const launchBrowser = async (): Promise<Browser> => {
    if (browserInstance) {
        return browserInstance;
    }
    try {
        const launchOptions: LaunchOptions = {
            headless: false,
        
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox'], //  Example args (optional)
            defaultViewport: { width: 1280, height: 800 },
        };
        browserInstance = await puppeteer.launch(launchOptions);
        logger.info('Browser launched successfully.');
        return browserInstance;
    } catch (error: any) {
        logger.error('Error launching browser:', error);
        throw new Error(`Failed to launch browser: ${error.message}`);
    }
};

export const getBrowserInstance = (): Browser | null => {
    return browserInstance;
};

export const closeBrowser = async (): Promise<void> => {
    if (browserInstance) {
        try {
            await browserInstance.close();
            browserInstance = null;
            logger.info('Browser closed successfully.');
        } catch (error: any) {
            logger.error('Error closing browser:', error);
            throw new Error(`Failed to close browser: ${error.message}`);
        }
    }
};
