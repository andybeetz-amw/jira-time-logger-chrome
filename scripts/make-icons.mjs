// Generates icon16/32/48/128 from the 128px source logo. Output is committed; run via `npm run icons`.
import sharp from 'sharp';

const source = 'src/images/jira_time_logger_logo.png';
for (const size of [16, 32, 48, 128]) {
    await sharp(source)
        .resize(size, size, { kernel: 'lanczos3' })
        .png({ compressionLevel: 9 })
        .toFile(`src/images/icon${size}.png`);
}
console.log('Generated icons');
