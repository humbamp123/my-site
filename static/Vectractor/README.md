# Vectractor 🎥

A beautiful, static web application for downloading Instagram videos, reels, and IGTV content.

## Features

- 🎨 Modern, gradient-based UI design
- 📱 Fully responsive for mobile and desktop
- ⚡ Fast and lightweight - pure HTML, CSS, and JavaScript
- 🔒 Privacy-focused - all processing happens in your browser
- 🎯 Supports multiple Instagram content types:
  - Regular video posts
  - Reels
  - IGTV videos

## How to Use

1. Copy any Instagram video, reel, or IGTV URL
2. Paste it into the input field
3. Click "Download Video"
4. Preview the video and click download to save it

## Installation

Simply open `index.html` in your web browser. No build process or dependencies required!

### Hosting

You can host this static site on any platform:

- **GitHub Pages**: Push to a repository and enable GitHub Pages
- **Netlify**: Drag and drop the folder
- **Vercel**: Deploy with a single command
- **Any web server**: Upload the files to your hosting

## How It Works

Vectractor uses multiple fallback methods to extract video URLs from Instagram:

1. **Embed API Method**: Fetches Instagram's embed page to extract video URLs
2. **Direct Parsing**: Parses the Instagram page's JSON-LD structured data
3. **CORS Proxy**: Uses a proxy service as a fallback for restricted content

The app tries each method in sequence until it successfully retrieves the video.

## Technical Stack

- Pure HTML5
- CSS3 with modern features (gradients, animations, flexbox)
- Vanilla JavaScript (ES6+)
- No frameworks or libraries required

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Limitations

Due to Instagram's API restrictions and CORS policies:

- Only public posts can be downloaded
- Some videos may require multiple attempts
- Instagram may change their page structure, affecting reliability
- Rate limiting may apply when using CORS proxies

## Privacy & Legal

- All processing happens client-side in your browser
- No data is stored or transmitted to any server (except for fetching Instagram content)
- Users are responsible for respecting copyright and Instagram's Terms of Service
- Only download content you have permission to use

## Development

The project structure is simple:

```
Vectractor/
├── index.html      # Main HTML structure
├── styles.css      # Styling and animations
├── script.js       # Instagram video extraction logic
├── LICENSE         # License file
└── README.md       # Documentation
```

To modify or extend:

1. Edit `index.html` for structure changes
2. Update `styles.css` for styling modifications
3. Modify `script.js` to add new features or extraction methods

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

See the LICENSE file for details.

## Disclaimer

This tool is for educational purposes and personal use. Users must comply with Instagram's Terms of Service and respect intellectual property rights. The developers are not responsible for misuse of this tool.

---

Made with ❤️ for easy Instagram video downloads
