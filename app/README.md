# Interview Preparation App - Static Build

This is a static build of the Interview Preparation App web version.

## Deployment

This static build can be deployed to any static hosting service:

### Netlify
1. Drag and drop the `dist` folder to Netlify
2. Or connect your repository and set:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Vercel
1. Deploy via Vercel CLI: `vercel`
2. Or connect your repository and set:
   - Build command: `npm run build`
   - Output directory: `dist`

### GitHub Pages
1. Copy contents of `dist` to your gh-pages branch
2. Or use GitHub Actions to build and deploy

### Other Static Hosts
- Firebase Hosting
- AWS S3 + CloudFront
- Azure Static Web Apps
- Surge.sh

## Configuration

Before deployment, ensure users have:
1. Valid OpenAI API key
2. Internet connection for OpenAI API calls
3. Modern browser with JavaScript enabled

## API Key Security

The OpenAI API key is stored in the browser's localStorage and never sent to the hosting server. It's only used for direct API calls to OpenAI's servers.

## Files Included

- `index.html` - Main application interface
- `app.js` - Application logic with OpenAI integration
- `styles.css` - Application styling
- `README.md` - This deployment guide

Built on: 2025-07-04T01:00:35.002Z
