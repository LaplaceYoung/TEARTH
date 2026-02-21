const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'world-geojson');
const outDir = path.join(__dirname, 'public', 'geo');

const countryToIso = {
    // States
    'australia': 'AUS',
    'canada': 'CAN',
    'india': 'IND',
    'switzerland': 'CHE',
    'thailand': 'THA',
    'usa': 'USA',
    // Areas
    'azerbaijan': 'AZE',
    'denmark': 'DNK',
    'ecuador': 'ECU',
    'france': 'FRA',
    'italy': 'ITA',
    'netherlands': 'NLD',
    'new_zealand': 'NZL',
    'norway': 'NOR',
    'portugal': 'PRT',
    'spain': 'ESP',
    'united_kingdom': 'GBR'
};

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function processDirectory(baseType) {
    const dirPath = path.join(srcDir, baseType);
    if (!fs.existsSync(dirPath)) return;

    const countries = fs.readdirSync(dirPath);
    for (const country of countries) {
        const iso = countryToIso[country];
        if (!iso) {
            console.log(`Unknown ISO code for country: ${country}`);
            continue;
        }

        // Some countries are in both states and areas (like usa), we need to append if exists
        const outPath = path.join(outDir, `${iso}_provinces.json`);
        let finalFeatures = [];
        if (fs.existsSync(outPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
                if (existing.features) finalFeatures = existing.features;
            } catch (e) { }
        }

        const countryDir = path.join(dirPath, country);
        const files = fs.readdirSync(countryDir).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(countryDir, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let features = data.type === 'FeatureCollection' ? data.features : [data];

                // Enhance features with a name property if missing
                features = features.map(f => {
                    if (!f.properties) f.properties = {};
                    if (!f.properties.name) {
                        f.properties.name = file.replace('.json', '').replace(/_/g, ' ');
                        // capitalize
                        f.properties.name = f.properties.name.replace(/\b\w/g, l => l.toUpperCase());
                    }
                    // Mark as province
                    f.isProvince = true;
                    return f;
                });

                finalFeatures.push(...features);
            } catch (e) {
                console.error(`Error reading ${filePath}`, e.message);
            }
        }

        const outputData = {
            type: 'FeatureCollection',
            features: finalFeatures
        };

        fs.writeFileSync(outPath, JSON.stringify(outputData));
        console.log(`Processed ${country} (${baseType}) -> ${iso}_provinces.json (${finalFeatures.length} features)`);
    }
}

processDirectory('states');
processDirectory('areas');
console.log('Done!');
