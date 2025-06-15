const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'favicon.ico': [16, 32, 48],
  'favicon-16x16.png': [16],
  'favicon-32x32.png': [32],
  'apple-touch-icon.png': [180]
};

const ogImageSize = {
  width: 1200,
  height: 630
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));
  
  // Generate favicon.ico (multi-size)
  const faviconSizes = sizes['favicon.ico'];
  const faviconBuffers = await Promise.all(
    faviconSizes.map(size => 
      sharp(svgBuffer)
        .resize(size, size)
        .toBuffer()
    )
  );
  
  // Generate PNG icons
  for (const [filename, sizeList] of Object.entries(sizes)) {
    if (filename === 'favicon.ico') continue;
    
    for (const size of sizeList) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, '../public', filename));
    }
  }
  
  // Generate OG image
  await sharp(svgBuffer)
    .resize(ogImageSize.width, ogImageSize.height)
    .composite([{
      input: Buffer.from(`
        <svg width="${ogImageSize.width}" height="${ogImageSize.height}">
          <rect width="100%" height="100%" fill="#0C5F2C"/>
          <text x="50%" y="50%" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
            EV Charging Network
          </text>
          <text x="50%" y="60%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
            India's Largest EV Charging Network
          </text>
        </svg>
      `),
      top: 0,
      left: 0
    }])
    .jpeg()
    .toFile(path.join(__dirname, '../public/og-image.jpg'));
}

generateIcons().catch(console.error); 