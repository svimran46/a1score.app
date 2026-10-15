const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generate() {
  const sourcePath = path.resolve(__dirname, '../public/icon-512.png');
  const sourceBase64 = fs.readFileSync(sourcePath).toString('base64');
  const dataUri = `data:image/png;base64,${sourceBase64}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
    });
  } catch {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
    });
  }

  const page = await browser.newPage();

  const densities = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const { dir, iconSize, fgSize } of densities) {
    const targetDir = path.resolve(__dirname, `../android/app/src/main/res/${dir}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Render square / round launcher icon
    const iconDataUrl = await page.evaluate(
      ({ dataUri, size }) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = dataUri;
        });
      },
      { dataUri, size: iconSize }
    );

    const iconBuffer = Buffer.from(iconDataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconBuffer);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), iconBuffer);

    // Render adaptive foreground icon (centered with safe zone padding)
    const fgDataUrl = await page.evaluate(
      ({ dataUri, size, innerSize }) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, size, size);
            const offset = (size - innerSize) / 2;
            ctx.drawImage(img, offset, offset, innerSize, innerSize);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = dataUri;
        });
      },
      { dataUri, size: fgSize, innerSize: Math.round(fgSize * 0.65) }
    );

    const fgBuffer = Buffer.from(fgDataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgBuffer);
    console.log(`Generated ${dir} icons (${iconSize}x${iconSize})`);
  }

  // Splash screen densities (portrait and landscape)
  const splashConfigs = [
    { dir: 'drawable', width: 480, height: 800, logoSize: 160 },
    { dir: 'drawable-port-mdpi', width: 320, height: 480, logoSize: 120 },
    { dir: 'drawable-port-hdpi', width: 480, height: 800, logoSize: 160 },
    { dir: 'drawable-port-xhdpi', width: 720, height: 1280, logoSize: 240 },
    { dir: 'drawable-port-xxhdpi', width: 960, height: 1600, logoSize: 320 },
    { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920, logoSize: 420 },
    { dir: 'drawable-land-mdpi', width: 480, height: 320, logoSize: 120 },
    { dir: 'drawable-land-hdpi', width: 800, height: 480, logoSize: 160 },
    { dir: 'drawable-land-xhdpi', width: 1280, height: 720, logoSize: 240 },
    { dir: 'drawable-land-xxhdpi', width: 1600, height: 960, logoSize: 320 },
    { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280, logoSize: 420 },
  ];

  for (const { dir, width, height, logoSize } of splashConfigs) {
    const targetDir = path.resolve(__dirname, `../android/app/src/main/res/${dir}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const splashDataUrl = await page.evaluate(
      ({ dataUri, width, height, logoSize }) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0a0d12';
            ctx.fillRect(0, 0, width, height);

            const x = (width - logoSize) / 2;
            const y = (height - logoSize) / 2;
            ctx.drawImage(img, x, y, logoSize, logoSize);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = dataUri;
        });
      },
      { dataUri, width, height, logoSize }
    );

    const splashBuffer = Buffer.from(splashDataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuffer);
    console.log(`Generated splash: ${dir} (${width}x${height})`);
  }

  await browser.close();
  console.log('Successfully generated all Android mipmap launcher icons and dark splash screens!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
