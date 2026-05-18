# Daily Task Manager

A robust, offline-ready Progressive Web App (PWA) built with Next.js 14 and Firebase to track and manage your daily tasks.

## Deployment Preparation

This application is fully prepared for zero-config deployment on Vercel. 

### 1. Set Up Firebase
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Go to **Project Settings > General** and click on the Web icon (`</>`) to add a web app.
3. Register the app (you can ignore Firebase Hosting if deploying to Vercel).
4. Firebase will provide a `firebaseConfig` object containing keys like `apiKey`, `authDomain`, etc.
5. In your Firebase project, navigate to **Firestore Database** and click **Create Database** (Start in production mode or test mode depending on your rules).
6. Ensure your Firestore Security rules allow reads/writes for your authenticated users (or open them for testing).

### 2. Configure Vercel Environment Variables
Before deploying, Vercel needs access to your Firebase configuration.
1. Create a new project on [Vercel](https://vercel.com/) and import your GitHub repository.
2. Before clicking Deploy, expand the **Environment Variables** section.
3. Add the following variables EXACTLY as they appear, using the values from your Firebase config:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Click Deploy!

### 3. Deploying via Vercel CLI (Alternative)
If you prefer deploying directly from your terminal:
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy to production: `vercel --prod`
4. *Note: You will still need to add the environment variables to your Vercel project settings.*

## Installing as a PWA (Progressive Web App)

Because this app includes a Web Manifest and Service Worker, it can be installed natively on your devices!

### Android (Chrome)
1. Open the deployed Vercel link in Google Chrome on your Android device.
2. Tap the **Install App** button in the header, OR
3. Tap the 3-dot menu in the top right corner of Chrome.
4. Select **Add to Home screen**.
5. The app will install and behave like a native APK.

### Desktop (Chrome)
1. Open the deployed Vercel link in Google Chrome on your computer.
2. In the right side of the URL/address bar, look for an install icon (a monitor with a downward arrow), OR click the **Install App** button in the app's header.
3. Click **Install**.
4. The app will open in its own standalone window and can be launched from your desktop or dock.
