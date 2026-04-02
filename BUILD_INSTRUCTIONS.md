# Production Build Instructions

## Setting Up Environment Variables

### 1. Update .env.production file
Replace the placeholder values in `.env.production` with your actual Supabase credentials:

```bash
VITE_SUPABASE_URL=https://kixmtnmfaezatkrhhuhj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeG10bm1mYWV6YXRrcmhodWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzY5MjMsImV4cCI6MjA2NDU1MjkyM30.loKb1ICZPG7EqiXCDkIti6sRcr9a9JJtuQcUyir2ZXc
```

### 2. Build for Production
```bash
# Build with production environment
npm run build -- --mode production

# Build for mobile (iOS/Android)
npm run build:mobile
```

### 3. Deploy to Mobile
```bash
# Sync with Capacitor
npx cap sync

# Open in Xcode for iOS
npx cap open ios

# Open in Android Studio
npx cap open android
```

## Important Notes
- The app now uses environment variables for Supabase configuration
- Production builds will use values from `.env.production`
- Development builds will fall back to hardcoded values if no env vars are set
- TestFlight builds will now connect to your live Supabase project