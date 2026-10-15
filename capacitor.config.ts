import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.a1score.mobile',
  appName: 'a1score',
  webDir: 'public',
  server: {
    url: 'https://a1score.pages.dev',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#0a0d12',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#0a0d12',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
