import { Page } from 'puppeteer';
import { getBrowserInstance } from '../utils/browserLauncher';
import { logger } from '../utils/logger';

export const pageElementAnalysisService = {
    async analyzeElement(url: string, selector: string): Promise<any | null> {
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

            await page.waitForSelector(selector);
            const element = await page.$(selector);
            if (!element) {
                logger.warn(`Element with selector "${selector}" not found on ${url}`);
                return null;
            }

            const boundingBox = await element.boundingBox();
            const textContent = await element.getProperty('textContent').then((t) => t?.jsonValue() || '');
            const attributes = await page.evaluate((el) => {
                const attr: { [key: string]: string } = {};
                if (el && el.attributes) {
                    for (let i = 0; i < el.attributes.length; i++) {
                        const attribute = el.attributes[i];
                        attr[attribute.name] = attribute.value;
                    }
                }
                return attr;
            }, element);

            return {
                tagName: await element.evaluate(node => node.tagName),
                textContent: textContent,
                attributes: attributes,
                box: boundingBox,
            };
        } catch (error) {
            logger.error(`Error analyzing element "${selector}" on ${url}:`, error);
            return null;
        } finally {
            if (page) {
                await page.close();
            }
        }
    },
};