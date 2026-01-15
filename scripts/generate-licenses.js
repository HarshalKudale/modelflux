const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'config', 'licenses.json');

async function generateLicenses() {
    console.log('Generating licenses...');
    const packageJson = require(path.join(ROOT_DIR, 'package.json'));
    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    const licenses = [];

    for (const [name, version] of Object.entries(dependencies)) {
        try {
            // Try to find package.json for the dependency
            // Use require.resolve to find the package path
            // This handles hoising and monorepo structures better than assuming node_modules/name
            let packagePath;
            try {
                // Try resolving the package.json directly
                packagePath = require.resolve(`${name}/package.json`, { paths: [ROOT_DIR] });
            } catch (e) {
                // Fallback: look in node_modules directly
                packagePath = path.join(ROOT_DIR, 'node_modules', name, 'package.json');
                if (!fs.existsSync(packagePath)) {
                    console.warn(`Could not find package.json for ${name}`);
                    continue;
                }
            }

            const pkg = require(packagePath);
            let licenseType = 'Unknown';
            if (pkg.license) {
                licenseType = typeof pkg.license === 'string' ? pkg.license : pkg.license.type;
            } else if (pkg.licenses) {
                licenseType = Array.isArray(pkg.licenses)
                    ? pkg.licenses.map(l => l.type || l).join(', ')
                    : 'Multiple';
            }

            licenses.push({
                name,
                version: pkg.version,
                license: licenseType,
                homepage: pkg.homepage || (pkg.repository ? (pkg.repository.url || pkg.repository) : ''),
                desc: pkg.description
            });
        } catch (error) {
            console.error(`Error processing ${name}:`, error.message);
            licenses.push({
                name,
                version: version.replace('^', '').replace('~', ''),
                license: 'Unknown',
                homepage: '',
                desc: ''
            });
        }
    }

    // Sort by name
    licenses.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(licenses, null, 2));
    console.log(`Wrote ${licenses.length} licenses to ${OUTPUT_FILE}`);
}

generateLicenses().catch(console.error);
