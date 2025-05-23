// Apify agent configuration for E-Control data extraction
// Using postal codes from Tyrolean municipalities

const fs = require('fs');

// Load postal codes from JSON file
const postalCodesData = JSON.parse(fs.readFileSync('./unique_plz.json', 'utf8'));
const postalCodes = postalCodesData.postal_codes;

// Apify agent configuration
const apifyConfig = {
    // Basic configuration
    name: 'econtrol-data-extractor',
    description: 'Extract energy community data for Tyrolean municipalities',
    
    // Input parameters
    input: {
        postalCodes: postalCodes,
        baseUrl: 'https://www.e-control.at', // Update with actual E-Control URL
        searchEndpoint: '/search', // Update with actual endpoint
        
        // Request configuration
        maxRequestRetries: 3,
        requestTimeoutSecs: 30,
        maxConcurrency: 5,
        
        // Output configuration
        outputFormat: 'json',
        saveToDataset: true
    },
    
    // Function to process each postal code
    processPostalCode: async function(postalCode, page) {
        console.log(`Processing PLZ: ${postalCode}`);
        
        // Example implementation - adjust based on actual website structure
        try {
            // Navigate to search page
            await page.goto(`${this.input.baseUrl}${this.input.searchEndpoint}`);
            
            // Enter postal code in search field
            await page.type('#plz-search', postalCode); // Update selector
            
            // Submit search
            await page.click('#search-submit'); // Update selector
            
            // Wait for results
            await page.waitForSelector('.search-results'); // Update selector
            
            // Extract data
            const data = await page.evaluate(() => {
                // Extract relevant data from the page
                // This is a template - update based on actual page structure
                const results = [];
                const items = document.querySelectorAll('.result-item');
                
                items.forEach(item => {
                    results.push({
                        name: item.querySelector('.name')?.textContent?.trim(),
                        address: item.querySelector('.address')?.textContent?.trim(),
                        // Add more fields as needed
                    });
                });
                
                return results;
            });
            
            return {
                postalCode,
                timestamp: new Date().toISOString(),
                resultCount: data.length,
                data
            };
            
        } catch (error) {
            console.error(`Error processing PLZ ${postalCode}:`, error);
            return {
                postalCode,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    // Main function
    main: async function() {
        const results = [];
        const totalPostalCodes = this.input.postalCodes.length;
        
        console.log(`Starting extraction for ${totalPostalCodes} postal codes`);
        
        // Process postal codes in batches
        const batchSize = this.input.maxConcurrency;
        for (let i = 0; i < totalPostalCodes; i += batchSize) {
            const batch = this.input.postalCodes.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(plz => this.processPostalCode(plz))
            );
            results.push(...batchResults);
            
            console.log(`Processed ${Math.min(i + batchSize, totalPostalCodes)} of ${totalPostalCodes} postal codes`);
        }
        
        // Save results
        const outputPath = `./extraction_results_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${outputPath}`);
        
        return results;
    }
};

module.exports = apifyConfig;

// If running directly (not as module)
if (require.main === module) {
    console.log('Postal codes loaded:', postalCodes.length);
    console.log('First 10 postal codes:', postalCodes.slice(0, 10));
    console.log('\nTo run the extraction, integrate this config with your Apify actor.');
}