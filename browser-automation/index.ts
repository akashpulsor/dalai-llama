import express, { Express, Request, Response } from 'express';
import { Server, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Browser, Page } from 'puppeteer';
import { SessionConfig } from './models/sessionConfig';
import { AnalysisPayload } from './models/analysisPayload';
import { logger } from './utils/logger';
import { screenshotService } from './services/screenshotService';
import { domAnalysisService } from './services/domAnalysisService';
import { pageElementAnalysisService } from './services/pageElementAnalysisService';
import { configurationService } from './services/configurationService';
import { closeBrowser, getBrowserInstance, launchBrowser } from './utils/browserLauncher';

const app: Express = express();
const port = 3000;
const websocketServerUrl = 'ws://localhost:8080/api/call/browser';

let wsConnection: WebSocket | null = null;
let currentSession: SessionConfig | null = null;
let browserInstance: Browser | null = null;

const connectToWebSocket = () => {
    wsConnection = new WebSocket(websocketServerUrl);

    wsConnection.on('open', () => {
        logger.info('Connected to Spring Boot WebSocket server.');
        if (currentSession) {
            const sessionStartPayload: AnalysisPayload = {
                type: 'sessionStart',
                requestId: uuidv4(),
                data: currentSession,
            };
            sendData(sessionStartPayload);
        }
    });

    wsConnection.on('message', (message) => {
        logger.info(`Received message from Spring Boot: ${message.toString()}`);
        try {
            const parsedMessage = JSON.parse(message.toString());
            handleCommand(parsedMessage);
        } catch (error) {
            logger.error('Error parsing message from Spring Boot', error);
        }
    });

    wsConnection.on('close', () => {
        wsConnection = null;
        logger.info('Disconnected from Spring Boot WebSocket server.');
        setTimeout(connectToWebSocket, 5000);
    });

    wsConnection.on('error', (error) => {
        logger.error('WebSocket error:', error);
        wsConnection = null;
    });
};

const sendData = (payload: AnalysisPayload) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(payload));
        logger.debug('Sent data to Spring Boot:', payload);
    } else {
        logger.warn('WebSocket connection to Spring Boot not open. Cannot send data:', payload);
    }
};

async function handleCommand(command: any) {
    logger.info(`Handling command: ${JSON.stringify(command)}`);
    switch (command.type) {
        case 'analyze':
            if (command.url) {
                try {
                    const screenshotData = await screenshotService.captureScreenshot(command.url);
                    const domContent = await domAnalysisService.getDom(command.url);
                    let elementData: any = null;
                    if (command.selector) {
                        elementData = await pageElementAnalysisService.analyzeElement(command.url, command.selector);
                    }

                    const payload: AnalysisPayload = {
                        type: 'analysisResult',
                        requestId: command.requestId,
                        data: {
                            url: command.url,
                            image: screenshotData,
                            html: domContent,
                            allElements: await getAllElements(command.url),
                            elementData: elementData,
                        },
                    };
                    sendData(payload);
                } catch (error: any) {
                    logger.error('Error during analysis:', error);
                    sendError(command.requestId, `Failed to analyze: ${error.message}`);
                }
            } else {
                sendError(command.requestId, 'URL is required for analysis.');
            }
            break;
        case 'launchBrowser':
            try {
                if (!browserInstance) {
                    browserInstance = await launchBrowser();
                    logger.info('Browser launched by command.');
                }
                sendSuccess(command.requestId, 'Browser launched successfully');
            } catch (error: any) {
                logger.error('Error launching browser', error);
                sendError(command.requestId, `Failed to launch browser: ${error.message}`);
            }
            break;
        case 'closeBrowser':
            try {
                if (browserInstance) {
                    await closeBrowser();
                    browserInstance = null;
                    logger.info('Browser closed by command.');
                }
                sendSuccess(command.requestId, 'Browser closed');
            } catch (error: any) {
                logger.error('Error closing browser', error);
                sendError(command.requestId, `Failed to close browser: ${error.message}`);
            }
            break;
        case 'case':
            if (command.action) {
                try {
                    const result = await performAction(command.url, command.action, command.selector, command.text);
                    sendSuccess(command.requestId, `Action ${command.action} performed`);
                } catch (error: any) {
                    logger.error(`Error performing action ${command.action}:`, error);
                    sendError(command.requestId, `Failed to perform action ${command.action}: ${error.message}`);
                }
            } else {
                sendError(command.requestId, 'Action is required for case command.');
            }
            break;
        case 'extract':
            if (command.url && command.selector) {
                try {
                    const extractedData = await pageElementAnalysisService.analyzeElement(command.url, command.selector);
                    const payload: AnalysisPayload = {
                        type: 'extractionResult',
                        requestId: command.requestId,
                        data: {
                            url: command.url,
                            selector: command.selector,
                            data: extractedData,
                        },
                    };
                    sendData(payload);
                } catch (error: any) {
                    logger.error('Error during extraction:', error);
                    sendError(command.requestId, `Failed to extract: ${error.message}`);
                }
            } else {
                sendError(command.requestId, 'URL and selector are required for extract command.');
            }
            break;
        default:
            logger.warn(`Unknown command type: ${command.type}`);
            sendError(command.requestId, `Unknown command type: ${command.type}`);
    }
}

async function getAllElements(url: string) {
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

        const elements = await page.$$('*');
        const allElementData = await Promise.all(
            elements.map(async (el) => {
                try {
                    const boundingBox = await el.boundingBox();
                    const textContent = await el.getProperty('textContent').then((t) => t?.jsonValue() || '');
                    const attributes = await page.evaluate((element) => {
                        const attr: { [key: string]: string } = {};
                        if (element && element.attributes) {
                            for (let i = 0; i < element.attributes.length; i++) {
                                const attribute = element.attributes[i];
                                attr[attribute.name] = attribute.value;
                            }
                        }
                        return attr;
                    }, el);

                    return {
                        tagName: await el.evaluate((node) => node.tagName),
                        textContent: textContent,
                        attributes: attributes,
                        box: boundingBox,
                    };
                } catch (e) {
                    logger.error('Error extracting element info', e);
                    return { error: 'Failed to extract element info' };
                }
            })
        );
        return allElementData;
    } catch (error) {
        logger.error(`Error retrieving all elements for ${url}:`, error);
        return null;
    } finally {
        if (page) {
            await page.close();
        }
    }
}

async function performAction(url: string, action: string, selector?: string, text?: string) {
    const browser = getBrowserInstance();
    if (!browser) {
        const errorMessage = 'Browser instance is not initialized.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    let page: Page | null = null;
    try {
        page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        switch (action) {
            case 'click':
                if (selector) {
                    await page.click(selector);
                } else {
                    throw new Error('Selector is required for click action.');
                }
                break;
            case 'scroll':
                await page.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                });
                break;
            case 'focus':
                if (selector) {
                    await page.focus(selector);
                } else {
                    throw new Error('Selector is required for focus action.');
                }
                break;
            case 'type':
                if (selector && text) {
                    await page.type(selector, text);
                } else {
                    throw new Error('Selector and Text are required for type action.');
                }
                break;
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
        return { success: true };
    } catch (error) {
        logger.error(`Error performing action ${action} on ${url}:`, error);
        throw error;
    } finally {
        if (page) {
            await page.close();
        }
    }
}

function sendError(requestId: string, message: string) {
    const errorPayload: AnalysisPayload = {
        type: 'error',
        requestId: requestId,
        data: { message: message },
    };
    sendData(errorPayload);
}

function sendSuccess(requestId: string, message: string) {
    const successPayload: AnalysisPayload = {
        type: 'success',
        requestId: requestId,
        data: { message: message },
    };
    sendData(successPayload);
}

// --- Express Routes ---
app.use(express.json());

app.post('/init', async (req: Request, res: Response) => {
    const { campaign, intent, portalDescription } = req.body;

    if (!campaign || !intent || !portalDescription) {
        return res.status(400).send('Please provide campaign, intent, and portalDescription.');
    }

    currentSession = {
        sessionId: `session-${Date.now()}`,
        campaign,
        intent,
        portalDescription,
    };

    try {
        await configurationService.loadConfig();
        connectToWebSocket();
        logger.info(`Initialization sequence started for session: ${currentSession.sessionId}`);
        res.status(200).send(`Initialization sequence started for session: ${currentSession.sessionId}`);
    } catch (error: any) {
        logger.error('Initialization error:', error);
        res.status(500).send(`Initialization failed: ${error.message}`);
    }
});

// --- Server Startup ---
const server = app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
});

// ---  Error Handling and Cleanup ---
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('beforeExit', async () => {
    logger.info('Server is exiting...');
    await closeBrowser();
    if (wsConnection) {
        wsConnection.close();
    }
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received. Exiting...');
    process.exit();
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received. Exiting...');
    process.exit();
});