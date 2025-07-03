# Troubleshooting Common Issues

## Cache Warnings (Windows)

If you see error messages like:
```
[ERROR:net\disk_cache\cache_util_win.cc:20] Unable to move the cache: Access is denied. (0x5)
[ERROR:gpu\ipc\host\gpu_disk_cache.cc:723] Gpu Cache Creation failed: -2
```

**Don't worry!** These are harmless Windows cache warnings that don't affect the app's functionality.

### Why This Happens
- Electron tries to create GPU and network cache files
- Windows sometimes restricts access to the default cache directory
- The app continues to work normally without the cache

### Solutions (Optional)
If you want to eliminate these warnings:

1. **Run as Administrator** (simplest solution):
   - Right-click on your terminal/command prompt
   - Select "Run as administrator"
   - Navigate to the app directory and run `npm start`

2. **Clear Electron Cache**:
   ```bash
   # Close the app first, then:
   rm -rf %APPDATA%\interview-preparation-app
   npm start
   ```

3. **Use Development Mode**:
   ```bash
   npm run dev
   ```

### Ignore Safely
These warnings are cosmetic and can be safely ignored. The Interview Preparation App will work perfectly regardless of these cache messages.

## Other Common Issues

### App Won't Start
1. Ensure Node.js is installed (`node --version`)
2. Run `npm install` to reinstall dependencies
3. Try `npm run dev` for development mode

### File Upload Issues
1. Check file format (PDF or TXT only)
2. Ensure file isn't password-protected
3. Try smaller files if large PDFs fail

### LM Studio Connection
1. Verify LM Studio is running
2. Check server is on 127.0.0.1:1234
3. Ensure a model is loaded (not just downloaded)
4. Click "Check Again" button in the app

### CodeMirror Editor Issues
1. Try refreshing the app (Ctrl+R)
2. Clear browser cache if using dev mode
3. Check console for JavaScript errors

## Debug Mode

For troubleshooting, start the app in development mode:
```bash
npm run dev
```

This opens developer tools where you can:
- Check console for errors
- Monitor network requests
- Debug JavaScript issues

## Getting Help

1. Check the console output for specific error messages
2. Review the README.md for setup instructions
3. Verify all dependencies are installed correctly
4. Test with the provided sample files first

---

**Remember**: The app is designed to work offline and without AI, so core functionality should always be available even if some features aren't working.
