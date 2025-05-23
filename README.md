# E-Control Data Extractor

Apify actor for extracting energy community data from E-Control using Austrian postal codes.

## Files Created

1. **unique_plz_list.txt** - Simple text list of 188 unique postal codes (one per line)
2. **unique_plz.json** - JSON format with postal codes array and metadata
3. **apify_config.js** - Configuration module for the Apify agent
4. **apify_actor.js** - Complete Apify actor implementation
5. **package.json** - Node.js package configuration

## Usage

### Local Testing
```bash
npm install
npm test  # Shows loaded postal codes
```

### Run Extraction
```bash
npm start
```

### List All Postal Codes
```bash
npm run list-plz
```

## Postal Code Data

The extraction uses 188 unique postal codes from Tyrolean municipalities, including:
- Major cities: Innsbruck (6020), Hall in Tirol (6060), Kufstein (6330)
- KEM regions: Various municipalities belonging to different KEM (Klima- und Energie-Modellregionen)

## Apify Integration

To use with Apify:
1. Create new actor on Apify platform
2. Upload the actor code (apify_actor.js)
3. Configure input parameters as needed
4. Run the actor to extract data for all postal codes

## Configuration

The actor accepts these input parameters:
- `postalCodes`: Array of postal codes (defaults to extracted list)
- `baseUrl`: E-Control website URL
- `maxConcurrency`: Number of parallel requests (default: 5)

## Output

Results are stored in Apify dataset with structure:
```json
{
  "plz": "6020",
  "url": "https://www.e-control.at/search?plz=6020",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "energyCommunities": [],
    "suppliers": [],
    "statistics": {}
  },
  "success": true
}
```