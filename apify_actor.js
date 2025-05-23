// Apify Actor for E-Control data extraction
// This is a complete Apify actor that can be deployed on the Apify platform

const Apify = require('apify');
const postalCodesData = require('./unique_plz.json');

Apify.main(async () => {
    // Get input
    const input = await Apify.getInput() || {};
    
    // Use postal codes from our extracted data
    const postalCodes = input.postalCodes || postalCodesData.postal_codes;
    const baseUrl = input.baseUrl || 'https://www.e-control.at';
    
    console.log(`Starting extraction for ${postalCodes.length} postal codes`);
    
    // Initialize request queue
    const requestQueue = await Apify.openRequestQueue();
    
    // Add requests for each postal code
    for (const plz of postalCodes) {
        await requestQueue.addRequest({
            url: `${baseUrl}/search?plz=${plz}`, // Adjust URL pattern
            userData: { plz }
        });
    }
    
    // Set up crawler
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        launchContext: {
            launchOptions: {
                headless: true,
            },
        },
        
        // Max concurrent pages
        maxConcurrency: input.maxConcurrency || 5,
        
        // Request handling
        handlePageFunction: async ({ request, page }) => {
            const { plz } = request.userData;
            console.log(`Processing PLZ: ${plz}`);
            
            try {
                // Wait for page to load
                await page.waitForSelector('body', { timeout: 30000 });
                
                // Extract data based on actual page structure
                const data = await page.evaluate(() => {
                    // This is a template - modify based on actual E-Control website
                    const extractedData = {
                        energyCommunities: [],
                        suppliers: [],
                        statistics: {}
                    };
                    
                    // Example: Extract energy community data
                    const communityElements = document.querySelectorAll('.energy-community');
                    communityElements.forEach(elem => {
                        extractedData.energyCommunities.push({
                            name: elem.querySelector('.name')?.textContent?.trim(),
                            type: elem.querySelector('.type')?.textContent?.trim(),
                            members: elem.querySelector('.members')?.textContent?.trim(),
                            // Add more fields as needed
                        });
                    });
                    
                    return extractedData;
                });
                
                // Store the result
                await Apify.pushData({
                    plz,
                    url: request.url,
                    timestamp: new Date().toISOString(),
                    data,
                    success: true
                });
                
            } catch (error) {
                console.error(`Error processing PLZ ${plz}:`, error);
                
                // Store error result
                await Apify.pushData({
                    plz,
                    url: request.url,
                    timestamp: new Date().toISOString(),
                    error: error.message,
                    success: false
                });
            }
        },
        
        // Error handling
        handleFailedRequestFunction: async ({ request }) => {
            console.error(`Request ${request.url} failed too many times`);
            await Apify.pushData({
                plz: request.userData.plz,
                url: request.url,
                timestamp: new Date().toISOString(),
                error: 'Request failed after max retries',
                success: false
            });
        },
    });
    
    // Run the crawler
    await crawler.run();
    
    console.log('Extraction completed!');
    
    // Get and display summary
    const dataset = await Apify.openDataset();
    const { items } = await dataset.getData();
    
    const successful = items.filter(item => item.success).length;
    const failed = items.filter(item => !item.success).length;
    
    console.log(`Summary: ${successful} successful, ${failed} failed out of ${items.length} total`);
});