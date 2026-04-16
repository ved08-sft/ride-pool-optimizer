const Jimp = require('jimp');

async function processImage(imagePath) {
    console.log("Processing", imagePath);
    try {
        const image = await Jimp.read(imagePath);
        
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        const visited = new Set();
        let head = 0;
        const queue = [];
        
        // Add all border pixels to queue
        for (let x = 0; x < width; x++) {
            queue.push({x, y: 0});
            queue.push({x, y: height - 1});
        }
        for (let y = 0; y < height; y++) {
            queue.push({x: 0, y});
            queue.push({x: width - 1, y});
        }
        
        let processedWhite = 0;

        while (head < queue.length) {
            const {x, y} = queue[head++];
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const color = Jimp.intToRGBA(image.getPixelColor(x, y));
            
            if (color.r > 230 && color.g > 230 && color.b > 230 && color.a > 0) {
                // Change to transparent
                image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 0), x, y);
                processedWhite++;
                
                queue.push({x: x + 1, y});
                queue.push({x: x - 1, y});
                queue.push({x, y: y + 1});
                queue.push({x, y: y - 1});
            }
        }
        
        console.log(`Removed ${processedWhite} background pixels.`);
        await image.writeAsync(imagePath); // replace the image
    } catch(err) {
        console.error("Error processing", imagePath, err);
    }
}

async function run() {
    await processImage('./public/audi_a6_3d.png');
    await processImage('./public/pickup_pin_3d.png');
    await processImage('./public/dropoff_pin_3d.png');
    console.log("Done");
}

run();
