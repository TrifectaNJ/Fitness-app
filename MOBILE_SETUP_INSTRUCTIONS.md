# Mobile App Setup Instructions

## Quick Start Guide for Android/iOS Export

Follow these steps to convert your React web app to mobile apps for Google Play Store and Apple App Store.

### Prerequisites
- Node.js installed
- Android Studio (for Android builds)
- Xcode (for iOS builds - Mac only)

### Step 1: Install Capacitor Dependencies

```bash
# Replace your package.json with the mobile version
cp package-mobile.json package.json

# Install dependencies
npm install
```

### Step 2: Initialize Capacitor

```bash
# Initialize Capacitor (run once)
npx cap init "Fitness Coach App" "com.fitnessapp.mobile"
```

### Step 3: Build and Setup Mobile Platforms

```bash
# Build web app and add mobile platforms
npm run mobile:setup
```

### Step 4: Development Workflow

```bash
# For Android development
npm run mobile:build:android

# For iOS development (Mac only)
npm run mobile:build:ios
```

### Step 5: Building for Production

#### Android (Google Play Store)
1. Run: `npm run mobile:build:android`
2. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Choose Android App Bundle (AAB)
   - Sign with your keystore
   - Upload AAB to Google Play Console

#### iOS (Apple App Store)
1. Run: `npm run mobile:build:ios`
2. In Xcode:
   - Select your team/provisioning profile
   - Product > Archive
   - Upload to App Store Connect

### Key Files Created
- `capacitor.config.ts` - Capacitor configuration
- `package-mobile.json` - Dependencies with Capacitor
- `android/` folder - Android project (created after setup)
- `ios/` folder - iOS project (created after setup)

### Useful Commands

```bash
# Sync changes to mobile platforms
npm run cap:sync

# Copy web assets to mobile
npm run cap:copy

# Open in native IDEs
npm run cap:open:android
npm run cap:open:ios

# Build and copy in one command
npm run build:mobile
```

### App Store Requirements

#### Both Stores Need:
- App icons (various sizes)
- Screenshots
- App description
- Privacy policy
- Terms of service

#### Google Play Store:
- Developer account ($25 one-time)
- App signing key
- Target API level compliance

#### Apple App Store:
- Developer account ($99/year)
- Apple Developer certificates
- App Store guidelines compliance

### Troubleshooting

1. **Build fails**: Ensure all dependencies installed
2. **Android Studio issues**: Update Android SDK
3. **iOS issues**: Check Xcode version compatibility
4. **App crashes**: Check browser console in web version first

### Next Steps After Setup

1. Test app on physical devices
2. Add app icons and splash screens
3. Configure app permissions
4. Prepare store listings
5. Submit for review

Your existing React app will work with minimal changes. Capacitor handles the web-to-native bridge automatically.