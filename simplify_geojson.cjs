const fs = require('fs');
const path = require('path');
const simplify = require('@turf/simplify').default;

const geoDir = path.join(__dirname, 'public', 'geo');
const outDir = path.join(__dirname, 'public', 'geo_simplified');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(geoDir).filter(f => f.endsWith('.json'));

let totalSaved = 0;

for (const file of files) {
    const filePath = path.join(geoDir, file);
    const outPath = path.join(outDir, file);

    const originalSize = fs.statSync(filePath).size;
    const rawData = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(rawData);

    // Use a tolerance of 0.05 degrees (adjust if necessary, it's roughly 5km)
    // Higher tolerance = more simplification
    // We want to reduce 10MB to < 500KB, so aggressive simplification.
    // highQuality=true uses Douglas-Peucker, mutate=true modifies in place.
    let tolerance = 0.02;
    if (originalSize > 5 * 1024 * 1024) tolerance = 0.05; // 5MB+
    else if (originalSize > 1024 * 1024) tolerance = 0.03; // 1MB+

    try {
        const simplified = simplify(geojson, { tolerance, highQuality: true, mutate: true });

        // Clean up precision to save more space, 4 decimals ~11m precision
        const compactJson = JSON.stringify(simplified, (key, val) => {
            if (typeof val === 'number') {
                return Number(val.toFixed(4));
            }
            return val;
        });

        fs.writeFileSync(outPath, compactJson, 'utf8');
        const newSize = fs.statSync(outPath).size;

        const mbSaved = (originalSize - newSize) / (1024 * 1024);
        totalSaved += mbSaved;

        console.log(`Simplified ${file}: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024).toFixed(0)}KB (Tolerance: ${tolerance})`);
    } catch (e) {
        console.error(`Error simplifying ${file}`, e.message);
    }
}

console.log(`Total space saved: ${totalSaved.toFixed(2)} MB`);
