/**
 * Generate favicons from abledger-logo.png
 * 
 * Requirements:
 * npm install sharp
 * 
 * Usage:
 * node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../../assets-files/abledger-logo.png');
const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateFavicons() {
  console.log('🎨 Generating favicons from abledger-logo.png...\n');

  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo not found at: ${logoPath}`);
      console.log('Please ensure abledger-logo.png exists in assets-files/');
      process.exit(1);
    }

    // Generate favicon.ico (32x32)
    console.log('Generating favicon.ico (32x32)...');
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-temp-32.png'));
    
    // Note: Creating actual .ico requires additional tool
    // For now, we'll create PNG versions
    fs.copyFileSync(
      path.join(publicDir, 'favicon-temp-32.png'),
      path.join(publicDir, 'favicon-32.png')
    );
    console.log('✅ Created favicon-32.png');

    // Generate icon-light-32x32.png
    console.log('Generating icon-light-32x32.png...');
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-light-32x32.png'));
    console.log('✅ Created icon-light-32x32.png');

    // Generate icon-dark-32x32.png
    console.log('Generating icon-dark-32x32.png...');
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-dark-32x32.png'));
    console.log('✅ Created icon-dark-32x32.png');

    // Generate apple-icon.png (180x180)
    console.log('Generating apple-icon.png (180x180)...');
    await sharp(logoPath)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'));
    console.log('✅ Created apple-icon.png');

    // Generate Open Graph image (1200x630) for social sharing
    console.log('Generating og-image.png (1200x630) for Open Graph...');
    await sharp(logoPath)
      .resize(630, 630, { fit: 'contain', background: { r: 9, g: 60, b: 147, alpha: 1 } })
      .extend({
        top: 0,
        bottom: 0,
        left: 285,
        right: 285,
        background: { r: 9, g: 60, b: 147, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✅ Created og-image.png');

    // Clean up temp file
    if (fs.existsSync(path.join(publicDir, 'favicon-temp-32.png'))) {
      fs.unlinkSync(path.join(publicDir, 'favicon-temp-32.png'));
    }

    console.log('\n✨ All favicons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Convert favicon-32.png to favicon.ico using an online tool or imagemagick');
    console.log('2. Update layout.tsx to use og-image.png for Open Graph if desired');
    console.log('3. Test favicons in different browsers and devices');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateFavicons();
}

module.exports = { generateFavicons };

