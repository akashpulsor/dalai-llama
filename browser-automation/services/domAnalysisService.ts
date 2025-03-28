import { Page } from 'puppeteer';
import { getBrowserInstance } from '../utils/browserLauncher';
import { logger } from '../utils/logger';

export const domAnalysisService = {
    async getDom(url: string): Promise<string | null> {
        const browser = getBrowserInstance();
        if (!browser) {
            const errorMessage = 'Browser instance is not initialized. Call initStagehand first.';
            logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        let page: Page | null = null;
        try {
            page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle0' });
            const domContent = await page.content();
            return domContent;
        } catch (error) {
            logger.error(`Error retrieving DOM for ${url}:`, error);
            return null;
        } finally {
            if (page) {
                await page.close();
            }
        }
    },
};