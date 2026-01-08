const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const WEB_DIST_DIR = path.join(__dirname, 'dist');

const BROWSERS = {
    chrome: 'chrome',
    firefox: 'firefox'
};

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

async function createZip(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`  Created: ${outPath} (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function buildExtension(browser) {
    console.log(`\nBuilding ${browser} extension...`);

    const browserSrcDir = path.join(__dirname, browser);
    const outputDir = path.join(WEB_DIST_DIR, browser);

    // Clean output directory
    cleanDir(outputDir);

    // Copy browser-specific files
    console.log('  Copying extension files...');
    copyRecursiveSync(browserSrcDir, outputDir);

    // Copy icons
    const iconsDir = path.join(__dirname, 'icons');
    if (fs.existsSync(iconsDir)) {
        copyRecursiveSync(iconsDir, path.join(outputDir, 'icons'));
    }

    // Create zip for distribution
    const zipPath = path.join(WEB_DIST_DIR, `modelflux-cors-helper-${browser}.zip`);
    await createZip(outputDir, zipPath);

    console.log(`  ${browser} extension built successfully!`);
}

async function main() {
    const target = process.argv[2] || 'all';

    console.log('ModelFlux CORS Helper Extension Builder');
    console.log('====================================');

    if (target === 'all') {
        for (const browser of Object.keys(BROWSERS)) {
            await buildExtension(browser);
        }
    } else if (BROWSERS[target]) {
        await buildExtension(target);
    } else {
        console.error(`Unknown target: ${target}`);
        console.error('Usage: node build.js [chrome|firefox|all]');
        process.exit(1);
    }

    console.log('\nBuild complete!');
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
