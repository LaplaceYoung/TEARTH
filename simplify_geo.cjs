const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const inDir = path.join(__dirname, 'public', 'geo');
const outDir = path.join(__dirname, 'public', 'geo_simplified');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(inDir).filter(f => f.endsWith('.json'));

for (const file of files) {
    const inPath = path.join(inDir, file);
    const outPath = path.join(outDir, file);

    const stat = fs.statSync(inPath);
    const sizeMb = stat.size / (1024 * 1024);

    const raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));

    if (sizeMb > 0.5) {
        console.log(`Simplifying ${file} (Size: ${sizeMb.toFixed(2)} MB)...`);
        // Determine tolerance based on file size. Larger file -> larger tolerance.
        let tolerance = 0.01;
        if (sizeMb > 5) tolerance = 0.05;
        if (sizeMb > 10) tolerance = 0.08;

        // Filter out valid geometries
        raw.features = raw.features.filter(f => f && f.geometry && typeof f.geometry.type === 'string');

        let simplified = raw;
        try {
            simplified = turf.simplify(raw, { tolerance, highQuality: true, mutate: true });
        } catch (e) {
            console.error(`  -> Failed to simplify ${file}:`, e.message);
        }
        fs.writeFileSync(outPath, JSON.stringify(simplified));

        const finalSizeMb = fs.statSync(outPath).size / (1024 * 1024);
        console.log(`  -> Done. New Size: ${finalSizeMb.toFixed(2)} MB`);
    } else {
        // Just copy
        console.log(`Copying ${file} (Size: ${sizeMb.toFixed(2)} MB)...`);
        fs.copyFileSync(inPath, outPath);
    }
}
console.log('All simplified geojson saved to public/geo_simplified.');
