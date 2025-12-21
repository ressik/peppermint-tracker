# PWA Icon Setup Instructions

## What You Need

Create icon images for your Peppermint Tracker app in the following sizes:
- **icon-512.png** (512x512) - Required for Android
- **icon-192.png** (192x192) - Required for Android
- **icon-384.png** (384x384) - Recommended
- **icon-256.png** (256x256) - Recommended
- **icon-96.png** (96x96) - Recommended

## How to Create Icons

### Option 1: Use an Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload a single high-quality image (at least 512x512)
   - Suggestion: A cute penguin image or the Peppermint penguin
3. Download the generated icons
4. Rename them to match the names above
5. Place all icons in the `/public` folder

### Option 2: Use an Image Editor
1. Create or find a 512x512 image of a penguin or your app logo
2. Use an image editor (Photoshop, GIMP, Canva, etc.) to resize to each size
3. Export as PNG files
4. Place all icons in the `/public` folder

## Icon Design Tips
- Use a simple, recognizable design (like a penguin icon)
- Ensure the icon looks good at small sizes (96x96)
- Use colors that match your app theme (Christmas red #c41e3a, white, etc.)
- Make sure the icon has good contrast
- Consider adding a colored background instead of transparent (Christmas theme colors)

## Where to Place Icons
All icon files should be placed in:
```
/public/icon-512.png
/public/icon-192.png
/public/icon-384.png
/public/icon-256.png
/public/icon-96.png
```

## Test Your Icons
After adding the icons and deploying:
1. Open your site on Android Chrome
2. Tap the three-dot menu
3. Select "Install app" or "Add to Home Screen"
4. You should see your custom icon!

## Quick Icon Sources
- Find free penguin icons at: https://www.flaticon.com/search?word=penguin
- Create custom icons at: https://www.canva.com/ (search for "app icon")
- Generate from emoji: https://favicon.io/emoji-favicons/penguin/
