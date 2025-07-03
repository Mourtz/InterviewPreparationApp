# Automated Binary Building Setup

This document explains how the automated binary building system works for the Interview Preparation App.

## Overview

The project uses GitHub Actions to automatically build desktop application binaries for Windows, macOS, and Linux whenever a new version tag is created.

## Workflow Files

### 1. `build-release.yml` - Production Release Builder
- **Trigger**: When a git tag starting with `v` is pushed (e.g., `v1.0.0`)
- **Platforms**: Windows, macOS, Linux
- **Outputs**: 
  - Windows: `.exe` installer, portable `.zip`
  - macOS: `.dmg` installer, `.zip` archive
  - Linux: `.AppImage`, `.deb`, `.rpm` packages
- **Action**: Creates a GitHub release with all binaries attached

### 2. `test-build.yml` - Test Builder
- **Trigger**: Manual workflow dispatch
- **Purpose**: Test builds without creating releases
- **Options**: Build for specific platform or all platforms
- **Outputs**: Build artifacts (no release created)

### 3. `deploy-gh-pages.yml` - Web Version Deployment
- **Trigger**: Push to main branch
- **Purpose**: Deploys the web version and landing page to GitHub Pages
- **Outputs**: Static website with download links

## Creating a Release

### Method 1: Using Release Scripts (Recommended)

#### On Windows:
```bash
# Run the batch script
release.bat v1.0.0

# Or run interactively
release.bat
```

#### On Linux/macOS:
```bash
# Make script executable (first time only)
chmod +x release.sh

# Run the script
./release.sh v1.0.0

# Or run interactively
./release.sh
```

The scripts will:
1. Validate the version format
2. Update `package.json` versions
3. Commit the version bump
4. Create and push the git tag
5. Trigger the GitHub Actions build

### Method 2: Manual Git Tags

```bash
# Update version in package.json manually
npm version 1.0.0 --no-git-tag-version

# Commit and create tag
git add package.json
git commit -m "Bump version to v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag to trigger build
git push origin main
git push origin v1.0.0
```

### Method 3: Manual Workflow Dispatch

You can also trigger releases manually from the GitHub Actions tab:
1. Go to your repository's Actions tab
2. Select "Build and Release Desktop App"
3. Click "Run workflow"
4. Enter the version number (e.g., v1.0.0)

## Build Process

When a release is triggered:

1. **Build Stage**: Three parallel jobs run on Windows, macOS, and Linux runners
   - Install Node.js and dependencies
   - Run electron-builder for the specific platform
   - Upload build artifacts

2. **Release Stage**: After all builds complete
   - Download all build artifacts
   - Create a GitHub release
   - Attach all binaries to the release
   - Update the release description with download links

## Download Links

Once a release is created, the binaries are available at:
- **Latest Release**: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/releases/latest`
- **Specific Release**: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/releases/tag/v1.0.0`

Direct download links:
- Windows: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/releases/latest/download/InterviewPreparationApp-Setup.exe`
- macOS: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/releases/latest/download/InterviewPreparationApp.dmg`
- Linux: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/releases/latest/download/InterviewPreparationApp.AppImage`

## Testing Builds

Before creating a release, you can test the build process:

1. Go to GitHub Actions tab
2. Select "Test Build Desktop App"
3. Click "Run workflow"
4. Choose platform (windows/macos/linux/all)
5. Check the artifacts in the workflow run

## Troubleshooting

### Build Failures

1. **Windows Build Issues**:
   - Usually related to code signing or Windows-specific dependencies
   - Check the electron-builder Windows configuration in `package.json`

2. **macOS Build Issues**:
   - Often related to code signing or notarization
   - macOS builds require Apple Developer account for distribution
   - For testing, you can disable signing in `package.json`

3. **Linux Build Issues**:
   - Usually the most reliable platform
   - Check AppImage, DEB, and RPM configurations

### Release Creation Issues

1. **Tag Already Exists**: Delete the tag and try again
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

2. **Permission Issues**: Ensure the repository has proper permissions for GitHub Actions

3. **Artifact Upload Issues**: Check file paths and names in the workflow

## Configuration

### Electron Builder Configuration

The build configuration is in `package.json` under the `build` section:

- **Windows**: NSIS installer, portable ZIP
- **macOS**: DMG installer, ZIP archive  
- **Linux**: AppImage, DEB, RPM packages

### GitHub Actions Permissions

The workflows require:
- `contents: write` - To create releases and upload assets
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Customization

### Adding New Platforms

To add new platforms or build targets:

1. Update the `build` section in `package.json`
2. Add new matrix entries in `build-release.yml`
3. Update the release preparation steps

### Modifying Release Notes

Edit the release body template in `build-release.yml` under the "Create Release" step.

### Changing Version Format

If you need a different version format, update:
1. The validation regex in release scripts
2. The tag trigger pattern in workflow files

## Security Considerations

- The workflows run in GitHub's secure environment
- No secrets are required for basic building
- For code signing, add signing certificates as repository secrets
- All builds are reproducible and auditable

## Monitoring

- Check build status at: `https://github.com/YOUR_USERNAME/InterviewPreparationApp/actions`
- Enable email notifications for failed builds in repository settings
- Monitor release download statistics in the repository insights
