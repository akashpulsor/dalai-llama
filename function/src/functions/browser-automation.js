const { app } = require('@azure/functions');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

const springBootWsUrl = process.env.SPRING_BOOT_WS_URL || 'ws://your-spring-boot-host:port/ws/stop-signal'; // Configure WebSocket URL
const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'downloads';

app.http('browser-automation', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
        context.log('Azure Function triggered for Puppeteer automation.');

        const functionRunId = uuidv4();
        context.log(`Function Run ID: ${functionRunId}`);

        let browser;
        let page;
        let isStopping = false;
        let stepCount = 0;
        const maxSteps = 50;
        let stopWebSocket; // Declare outside the try block

        try {
            stopWebSocket = new WebSocket(springBootWsUrl);

            stopWebSocket.onopen = () => {
                context.log('Connected to Spring Boot WebSocket server.');
            };

            stopWebSocket.onmessage = (event) => {
                if (event.data === 'stop') {
                    context.log('Received stop signal from Spring Boot.');
                    isStopping = true;
                }
            };

            stopWebSocket.onclose = () => {
                context.log('Disconnected from Spring Boot WebSocket server.');
            };

            stopWebSocket.onerror = (error) => {
                context.error('WebSocket error:', error);
            };

            browser = await puppeteer.launch({ headless: "new" });
            page = await browser.newPage();

            const startUrl = req.query.url || (req.body && req.body.url);
            const initialSessionData = req.body && req.body.sessionData;

            if (!startUrl && !initialSessionData) {
                context.res = { status: 400, body: "Please provide a 'url' or 'sessionData'." };
                return;
            }

            if (startUrl) {
                await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
                context.log(`Navigated to: ${startUrl}`);
            }

            if (initialSessionData) {
                context.log('(Conceptual) Applying initial session data.');
                if (initialSessionData.cookies) {
                    await page.setCookie(...initialSessionData.cookies);
                }
            }

            while (stepCount < maxSteps && !isStopping) {
                stepCount++;
                context.log(`Step: ${stepCount}`);

                const domContent = await page.content();
                context.log('DOM captured.');

                try {
                    const analysisResponse = await axios.post(`${springBootUrl}/analyze-dom`, {
                        functionRunId: functionRunId,
                        dom: domContent,
                        currentUrl: page.url()
                    });
                    const nextAction = analysisResponse.data;
                    context.log('Received next action from Spring Boot:', nextAction);

                    if (!nextAction || !nextAction.action) {
                        context.log('No action received or automation considered complete by Spring Boot.');
                        break;
                    }

                    switch (nextAction.action) {
                        case 'click':
                            if (nextAction.selector) {
                                try {
                                    await page.click(nextAction.selector, nextAction.clickOptions || {});
                                    context.log(`Clicked element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error clicking ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'type':
                            if (nextAction.selector && nextAction.text) {
                                try {
                                    await page.type(nextAction.selector, nextAction.text, nextAction.typeOptions || {});
                                    context.log(`Typed "${nextAction.text}" in ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error typing in ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'navigate':
                            if (nextAction.url) {
                                try {
                                    await page.goto(nextAction.url, nextAction.navigationOptions || { waitUntil: 'domcontentloaded' });
                                    context.log(`Navigated to: ${nextAction.url}`);
                                } catch (error) {
                                    context.error(`Error navigating to ${nextAction.url}: ${error.message}`);
                                }
                            }
                            break;
                        case 'scrollDown':
                            await page.mouse.wheel(0, nextAction.deltaY || 500);
                            context.log(`Scrolled down by ${nextAction.deltaY || 500} pixels.`);
                            break;
                        case 'scrollUp':
                            await page.mouse.wheel(0, -(nextAction.deltaY || 500));
                            context.log(`Scrolled up by ${nextAction.deltaY || 500} pixels.`);
                            break;
                        case 'scrollTo':
                            if (nextAction.x !== undefined && nextAction.y !== undefined) {
                                await page.evaluate((x, y) => window.scrollTo(x, y), nextAction.x, nextAction.y);
                                context.log(`Scrolled to coordinates: x=<span class="math-inline">\{nextAction\.x\}, y\=</span>{nextAction.y}`);
                            } else if (nextAction.selector) {
                                await page.evaluate((selector, options) => {
                                    const element = document.querySelector(selector);
                                    if (element) {
                                        element.scrollIntoView(options);
                                    }
                                }, nextAction.selector, nextAction.scrollIntoViewOptions || {});
                                context.log(`Scrolled to element with selector: ${nextAction.selector}`);
                            }
                            break;
                        case 'waitForSelector':
                            if (nextAction.selector) {
                                try {
                                    await page.waitForSelector(nextAction.selector, nextAction.waitForOptions || { timeout: 10000 });
                                    context.log(`Waited for selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.warn(`Timeout waiting for selector: ${nextAction.selector}`);
                                }
                            }
                            break;
                        case 'waitForXPath':
                            if (nextAction.xpath) {
                                try {
                                    await page.waitForXPath(nextAction.xpath, nextAction.waitForOptions || { timeout: 10000 });
                                    context.log(`Waited for XPath: ${nextAction.xpath}`);
                                } catch (error) {
                                    context.warn(`Timeout waiting for XPath: ${nextAction.xpath}`);
                                }
                            }
                            break;
                        case 'waitForTimeout':
                            if (nextAction.timeout) {
                                await new Promise(resolve => setTimeout(resolve, parseInt(nextAction.timeout)));
                                context.log(`Waited for ${nextAction.timeout} milliseconds.`);
                            }
                            break;
                        case 'extractText':
                            if (nextAction.selector && nextAction.outputKey) {
                                try {
                                    const text = await page.$eval(nextAction.selector, el => el.innerText);
                                    context.log(`Extracted text from ${nextAction.selector}: ${text} (Key: ${nextAction.outputKey})`);
                                    await axios.post(`${springBootUrl}/store-data`, { functionRunId, key: nextAction.outputKey, value: text });
                                } catch (error) {
                                    context.error(`Error extracting text from ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'extractAttribute':
                            if (nextAction.selector && nextAction.attribute && nextAction.outputKey) {
                                try {
                                    const attributeValue = await page.$eval(nextAction.selector, (el, attribute) => el.getAttribute(attribute), nextAction.attribute);
                                    context.log(`Extracted attribute "${nextAction.attribute}" with value: ${attributeValue} from ${nextAction.selector} (Key: ${nextAction.outputKey})`);
                                    await axios.post(`${springBootUrl}/store-data`, { functionRunId, key: nextAction.outputKey, value: attributeValue });
                                } catch (error) {
                                    context.error(`Error extracting attribute "${nextAction.attribute}" from ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'select':
                            if (nextAction.selector && nextAction.values) {
                                try {
                                    await page.select(nextAction.selector, ...nextAction.values);
                                    context.log(`Selected value(s) "${nextAction.values}" in ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error selecting value(s) in ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'check':
                            if (nextAction.selector) {
                                try {
                                    await page.check(nextAction.selector, nextAction.checkOptions || {});
                                    context.log(`Checked element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error checking element ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'uncheck':
                            if (nextAction.selector) {
                                try {
                                    await page.uncheck(nextAction.selector, nextAction.uncheckOptions || {});
                                    context.log(`Unchecked element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error unchecking element ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'goBack':
                            try {
                                await page.goBack(nextAction.navigationOptions || {});
                                context.log('Navigated back.');
                            } catch (error) {
                                context.warn('Error navigating back.');
                            }
                            break;
                        case 'goForward':
                            try {
                                await page.goForward(nextAction.navigationOptions || {});
                                context.log('Navigated forward.');
                            } catch (error) {
                                context.warn('Error navigating forward.');
                            }
                            break;
                        case 'reload':
                            try {
                                await page.reload(nextAction.navigationOptions || { waitUntil: 'domcontentloaded' });
                                context.log('Page reloaded.');
                            } catch (error) {
                                context.warn('Error reloading page.');
                            }
                            break;
                        case 'focus':
                            if (nextAction.selector) {
                                try {
                                    await page.focus(nextAction.selector);
                                    context.log(`Focused on element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error focusing on ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'blur':
                            if (nextAction.selector) {
                                try {
                                    await page.blur(nextAction.selector);
                                    context.log(`Blurred element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error blurring ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'press':
                            if (nextAction.key) {
                                try {
                                    await page.keyboard.press(nextAction.key, nextAction.pressOptions || {});
                                    context.log(`Pressed key: ${nextAction.key}`);
                                } catch (error) {
                                    context.error(`Error pressing key ${nextAction.key}: ${error.message}`);
                                }
                            }
                            break;
                        case 'tap':
                            if (nextAction.selector) {
                                try {
                                    await page.tap(nextAction.selector);
                                    context.log(`Tapped element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error tapping ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'setInputFiles':
                            if (nextAction.selector && nextAction.filePaths && Array.isArray(nextAction.filePaths)) {
                                try {
                                    await page.setInputFiles(nextAction.selector, nextAction.filePaths);
                                    context.log(`Set input files for ${nextAction.selector}: ${nextAction.filePaths.join(', ')}`);
                                } catch (error) {
                                    context.error(`Error setting input files for ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'evaluate':
                            if (nextAction.script) {
                                try {
                                    const result = await page.evaluate(nextAction.script, nextAction.scriptArgs);
                                    context.log(`Evaluated script: ${nextAction.script} - Result: ${JSON.stringify(result)}`);
                                    await axios.post(`${springBootUrl}/store-evaluation-result`, { functionRunId, result: JSON.stringify(result), script: nextAction.script });
                                } catch (error) {
                                    context.error(`Error evaluating script: ${error.message}`);
                                }
                            }
                            break;
                        case 'emulateMediaType':
                            if (nextAction.mediaType) {
                                await page.emulateMediaType(nextAction.mediaType);
                                context.log(`Emulated media type: ${nextAction.mediaType}`);
                            }
                            break;
                        case 'hover':
                            if (nextAction.selector) {
                                try {
                                    await page.hover(nextAction.selector);
                                    context.log(`Hovered over element with selector: ${nextAction.selector}`);
                                } catch (error) {
                                    context.error(`Error hovering over ${nextAction.selector}: ${error.message}`);
                                }
                            }
                            break;
                        case 'dragAndDrop':
                            if (nextAction.dragSelector && nextAction.dropSelector) {
                                try {
                                    await page.dragAndDrop(nextAction.dragSelector, nextAction.dropSelector);
                                    context.log(`Dragged from ${nextAction.dragSelector} to ${nextAction.dropSelector}`);
                                } catch (error) {
                                    context.error(`Error performing drag and drop: ${error.message}`);
                                }
                            } else if (nextAction.x !== undefined && nextAction.y !== undefined && nextAction.dropX !== undefined && nextAction.dropY !== undefined) {
                                await page.mouse.move(parseInt(nextAction.x), parseInt(nextAction.y));
                                await page.mouse.down();
                                await page.mouse.move(parseInt(nextAction.dropX), parseInt(nextAction.dropY));
                                await page.mouse.up();
                                context.log(`Performed manual drag and drop to coordinates.`);
                            }
                            break;
                        case 'emulateDevice':
                            if (nextAction.deviceName) {
                                const devices = require('puppeteer/devices');
                                const device = devices[nextAction.deviceName];
                                if (device) {
                                    await page.emulate(device);
                                    context.log(`Emulated device: ${nextAction.deviceName}`);
                                } else {
                                    context.warn(`Device "${nextAction.deviceName}" not found.`);
                                }
                            }
                            break;
                        case 'setViewport':
                            if (nextAction.width && nextAction.height) {
                                await page.setViewport({ width: parseInt(nextAction.width), height: parseInt(nextAction.height) });
                                context.log(`Set viewport to: width=<span class="math-inline">\{nextAction\.width\}, height\=</span>{nextAction.height}`);
                            }
                            break;
                        case 'setUserAgent':
                            if (nextAction.userAgent) {
                                await page.setUserAgent(nextAction.userAgent);
                                context.log(`Set user agent to: ${nextAction.userAgent}`);
                            }
                            break;
                        case 'handleAlert':
                            page.once('dialog', async dialog => {
                                if (nextAction.accept) {
                                    await dialog.accept(nextAction.promptText);
                                    context.log(`Handled alert: Accepted with text "${nextAction.promptText || ''}"`);
                                } else {
                                    await dialog.dismiss();
                                    context.log('Handled alert: Dismissed.');
                                }
                            });
                            break;
                        case 'handleConfirm':
                            page.once('dialog', async dialog => {
                                if (nextAction.accept) {
                                    await dialog.accept();
                                    context.log('Handled confirm: Accepted.');
                                } else {
                                    await dialog.dismiss();
                                    context.log('Handled confirm: Dismissed.');
                                }
                            });
                            break;
                        case 'handlePrompt':
                            page.once('dialog', async dialog => {
                                await dialog.accept(nextAction.promptResponse || '');
                                context.log(`Handled prompt: Accepted with response "${nextAction.promptResponse || ''}"`);
                            });
                            break;
                        case 'focusFrame':
                            if (nextAction.frameName || nextAction.frameUrl) {
                                let frame;
                                if (nextAction.frameName) {
                                    frame = await page.frame({ name: nextAction.frameName });
                                } else if (nextAction.frameUrl) {
                                    frame = await page.frame({ url: nextAction.frameUrl });
                                }
                                if (frame) {
                                    // You might want to store the frame reference or perform actions within it
                                    context.log(`Focused on frame: ${nextAction.frameName || nextAction.frameUrl}`);
                                    // For simplicity here, we just log that we found it. Subsequent actions
                                    // on 'page' will still target the main frame unless you explicitly work with 'frame'.
                                } else {
                                    context.warn(`Frame not found: ${nextAction.frameName || nextAction.frameUrl}`);
                                }
                            }
                            break;
                        case 'evaluateInFrame':
                            if (nextAction.frameName && nextAction.script) {
                                const frame = await page.frame({ name: nextAction.frameName });
                                if (frame) {
                                    try {
                                        const result = await frame.evaluate(nextAction.script, nextAction.scriptArgs);
                                        context.log(`Evaluated script in frame "${nextAction.frameName}": ${nextAction.script} - Result: ${JSON.stringify(result)}`);
                                        await axios.post(`${springBootUrl}/store-frame-evaluation`, { functionRunId, frameName: nextAction.frameName, result: JSON.stringify(result), script: nextAction.script });
                                    } catch (error) {
                                        context.error(`Error evaluating script in frame "${nextAction.frameName}": ${error.message}`);
                                    }
                                } else {
                                    context.warn(`Frame "${nextAction.frameName}" not found for evaluation.`);
                                }
                            }
                            break;
                        case 'waitForFunction':
                            if (nextAction.function && nextAction.polling) {
                                try {
                                    const result = await page.waitForFunction(nextAction.function, {
                                        polling: nextAction.polling,
                                        timeout: nextAction.timeout || 30000,
                                    }, nextAction.functionArgs);
                                    context.log(`waitForFunction completed with result: ${JSON.stringify(await result.jsonValue())}`);
                                } catch (error) {
                                    context.error(`waitForFunction timed out or failed: ${error.message}`);
                                }
                            }
                            break;
                        case 'setCookie':
                            if (nextAction.cookies && Array.isArray(nextAction.cookies)) {
                                try {
                                    await page.setCookie(...nextAction.cookies);
                                    context.log(`Set cookies: ${JSON.stringify(nextAction.cookies)}`);
                                } catch (error) {
                                    context.error(`Error setting cookies: ${error.message}`);
                                }
                            }
                            break;
                        case 'deleteCookie':
                            if (nextAction.names && Array.isArray(nextAction.names)) {
                                await page.deleteCookie(...nextAction.names);
                                context.log(`Deleted cookies: ${nextAction.names.join(', ')}`);
                            }
                            break;
                        case 'enableRequestInterception':
                            await page.setRequestInterception(true);
                            context.log('Request interception enabled.');
                            // You would typically set up listeners for 'request' event after this
                            break;
                        case 'disableRequestInterception':
                            await page.setRequestInterception(false);
                            context.log('Request interception disabled.');
                            break;
                        case 'downloadFile':
                            if (nextAction.fileUrl || nextAction.clickSelector) {
                                    let downloadUrl = nextAction.fileUrl;
                                    if (nextAction.clickSelector) {
                                            const [response] = await Promise.all([
                                            page.waitForResponse(response => response.request().resourceType() !== 'document'),
                                            page.click(nextAction.clickSelector),
                                        ]);
                                        if (response) {
                                            downloadUrl = response.url();
                                            context.log(`Initiated download by clicking selector: ${nextAction.clickSelector}, URL: ${downloadUrl}`);
                                        } else {
                                            context.warn(`No response received after clicking download selector.`);
                                            break;
                                        }
                                    } else if (downloadUrl) {
                                        context.log(`Attempting direct download from URL: ${downloadUrl}`);
                                        if (!storageConnectionString) {
                                            context.error('Azure Storage Connection String is missing for direct download.');
                                            break;
                                        }
                                        try {
                                            const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
                                            const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
                                            const containerClient = blobServiceClient.getContainerClient(blobContainerName);
                                            const filename = path.basename(downloadUrl);
                                            const blockBlobClient = containerClient.getBlockBlobClient(`${functionRunId}/${filename}`);
                                            const buffer = await streamToBuffer(response.data);
                                            await blockBlobClient.upload(buffer, buffer.length);
                                            context.log(`File "${filename}" downloaded and uploaded to Blob Storage: ${blockBlobClient.url}`);
                                            await axios.post(`${springBootUrl}/upload-complete`, { functionRunId, blobUrl: blockBlobClient.url, filename });
                                        } catch (downloadError) {
                                            context.error('Error during direct download or upload:', downloadError.message);
                                        }
                                        break;
                                    }
                                    if (downloadUrl && nextAction.clickSelector) {
                                        page.on('download', async (download) => {
                                            const suggestedFilename = download.suggestedFilename();
                                            const tempDownloadPath = await download.path();

                                            if (tempDownloadPath) {
                                                context.log(`File downloaded to: ${tempDownloadPath}, suggested name: ${suggestedFilename}`);

                                                if (!storageConnectionString) {
                                                    context.error('Azure Storage Connection String is missing.');
                                                    return;
                                                }

                                                const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
                                                const containerClient = blobServiceClient.getContainerClient(blobContainerName);
                                                const blockBlobClient = containerClient.getBlockBlobClient(`${functionRunId}/${suggestedFilename}`);

                                                try {
                                                    await blockBlobClient.uploadFile(tempDownloadPath);
                                                    context.log(`File "${suggestedFilename}" uploaded to Blob Storage: ${blockBlobClient.url}`);
                                                    await axios.post(`${springBootUrl}/upload-complete`, { functionRunId, blobUrl: blockBlobClient.url, filename: suggestedFilename });
                                                    await fs.unlink(tempDownloadPath);
                                                    context.log(`Temporary file "${tempDownloadPath}" deleted.`);
                                                } catch (uploadError) {
                                                    context.error('Error uploading to Blob Storage:', uploadError.message);
                                                    await fs.unlink(tempDownloadPath);
                                                }
                                            } else {
                                                context.error('Download path not found.');
                                            }
                                        });
                                        // Re-trigger the click if needed
                                        try {
                                            await page.click(nextAction.clickSelector);
                                        } catch (clickError) {
                                            context.error(`Error re-clicking download selector: ${clickError.message}`);
                                        }
                                    }
                            } else {
                                context.warn('Action "downloadFile" requires "fileUrl" or "clickSelector".');
                            }
                            break;

                        default:
                            context.log(`Unknown action: ${nextAction.action}`);    
                    }

                    const screenshotBuffer = await page.screenshot({ fullPage: true });
                    const base64Screenshot = screenshotBuffer.toString('base64');
                    const liveData = {
                        functionRunId: functionRunId,
                        step: stepCount,
                        url: page.url(),
                        screenshot: base64Screenshot,
                        log: `Performed action: ${nextAction.action}`
                    };

                    // Send live data via WebSocket
                    if (stopWebSocket && stopWebSocket.readyState === WebSocket.OPEN) {
                        try {
                            stopWebSocket.send(JSON.stringify({ type: 'live-data', data: liveData }));
                            context.log('Published live data to Spring Boot via WebSocket.');
                        } catch (error) {
                            context.error('Error sending live data via WebSocket:', error.message);
                        }
                    } else {
                        context.warn('WebSocket connection not open, cannot send live data.');
                    }

                    // Removed the axios.post for live data

                    await new Promise(resolve => setTimeout(resolve, 1500));

                    if (isStopping) {
                        context.log('Stop signal detected, breaking the loop.');
                        break;
                    }

                } catch (error) {
                    context.error('Error during step execution:', error.message);
                    break;
                }
            }

            await browser.close();
            context.log('Puppeteer browser closed.');
            context.res = { status: 200, body: { functionRunId, status: isStopping ? "stopped" : "completed" } };

        } catch (error) {
            context.error('Error during Puppeteer automation:', error.message);
            if (browser) await browser.close();
            context.res = { status: 500, body: { functionRunId, error: error.message } };
        } finally {
            if (!context.res) context.res = { status: 500, body: { functionRunId, error: "Function execution error." } };
            if (stopWebSocket && stopWebSocket.readyState === WebSocket.OPEN) {
                stopWebSocket.close();
            }
        }
    }
});



// Helper function to convert a stream to a buffer (for direct download)
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}