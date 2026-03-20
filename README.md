# Microstructure Visualizer

A web-based interactive application for visualizing microstructures, built for performance and responsive design.

## Features
- **Fast and Responsive**: Optimized for quick loading and smooth interaction.
- **Modern Build**: Bundled using Vite for optimized static asset delivery.
- **Client-Side Routing**: Ready for hosting on any static web server like Netlify, Vercel, or GitHub Pages.

## Running Locally

Because this is a production-ready static build, you can just serve the directory using any local web server.

### Using Node.js
```bash
npx serve -s . -p 8080
```

### Using Python
```bash
python -m http.server 8080
```

Then visit `http://localhost:8080` in your web browser.

## Deployment

Since this is a static build, you can directly deploy this folder to services like Netlify, Vercel, or push it to a repository to deploy via GitHub Pages.

- **Netlify**: A `_redirects` file is included for proper client-side routing on Netlify.
- **GitHub Pages**: You can enable GitHub pages from the repository settings, pointing to the branch where these files are committed.
