# Deployment Guide: Wheel within a Wheel Game

## 🚀 Deploy to Render (Recommended)

### Quick Deploy
1. **Fork/Clone** this repository to your GitHub account
2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New +" → "Static Site"
   - Select this repository

3. **Configure Build**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: 18

4. **Deploy**: Click "Create Static Site"

### Manual Deploy
1. **Build locally**:
   ```bash
   npm install
   npm run build
   ```

2. **Upload dist folder** to Render's static site service

## 🌐 Other Deployment Options

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel
1. Import GitHub repository
2. Framework preset: Other
3. Build command: `npm run build`
4. Output directory: `dist`

### GitHub Pages
1. Build locally: `npm run build`
2. Push `dist` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Traditional Web Hosting
1. Build: `npm run build`
2. Upload entire `dist` folder contents to web server
3. Ensure server serves `index.html` for all routes

## 📋 Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Test built files locally
- [ ] Verify all assets load correctly
- [ ] Test on multiple browsers
- [ ] Check mobile responsiveness
- [ ] Verify audio works (requires user interaction)

## 🔧 Build Configuration

### Environment Variables (Optional)
```bash
NODE_ENV=production
GAME_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### Build Output
- **Bundle Size**: ~263KB (optimized)
- **Files**: HTML, JS, CSS, source maps
- **Compression**: Gzip recommended
- **Caching**: Static assets are cache-friendly

## 🎯 Performance Tips

1. **Enable Gzip**: Reduces bundle size by ~70%
2. **Set Cache Headers**: Cache static assets for 1 year
3. **Use CDN**: For global distribution
4. **Monitor Performance**: Use Lighthouse for optimization

## 🔒 Security Headers (Recommended)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (18+ recommended)
- Run `npm install` to ensure dependencies
- Check for TypeScript errors: `npm run type-check`

### Game Doesn't Load
- Verify all files uploaded correctly
- Check browser console for errors
- Ensure server serves correct MIME types

### Audio Issues
- Audio requires user interaction to start
- Check browser autoplay policies
- Verify audio files are accessible

## 📞 Support

For deployment issues:
1. Check the browser console for errors
2. Verify network requests in DevTools
3. Test locally first: `npm run dev`
4. Review the deployment logs on your hosting platform

---

**🎉 Your Wheel within a Wheel game is ready to spin online!**