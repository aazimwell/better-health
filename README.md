# Better Health — Physiotherapy & Chiropractic (React Native + Expo + Supabase)

Better Health is a mobile app for physiotherapy and chiropractic care. It helps patients discover services, book appointments, follow treatment and exercise plans, and stay in touch with their clinicians — all from one place.

## Features

- Browse physiotherapy and chiropractic services and clinicians
- Book, reschedule, and manage appointments
- View treatment plans, exercises, and progress
- Secure sign-in and patient profiles with Supabase Auth
- Real-time data and storage powered by Supabase

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase (PostgreSQL, Auth, and Storage)
- Expo Router

## Prerequisites

Before you start, make sure you have:

- Node.js 18 or later and npm
- Git
- The Expo Go app on your phone, or an Android emulator / iOS simulator
- A Supabase account and project (see Supabase Setup below)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/aazimwell/better-health.git
cd better-health
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a project at https://supabase.com.
2. In the Supabase dashboard, go to **Project Settings > API** and copy your project URL and anon public key.
3. Create the tables, authentication settings, and storage buckets your app needs, and enable Row Level Security for patient data.

### 4. Configure environment variables

Create a `.env` file in the project root and add your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not commit real secrets or service-role keys to the repository.

### 5. Start the app

```bash
npx expo start
```

Then:

- Press `a` to open the Android emulator
- Press `i` to open the iOS simulator
- Press `w` to open the web version
- Scan the QR code with Expo Go to run it on your phone

## Available Scripts

```bash
npm start        # Start the Expo development server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run on the web
```

## Project Structure

```text
app/        # Screens and navigation (Expo Router)
components/ # Reusable UI components
lib/        # Supabase client and helpers
assets/     # Images and fonts
```

## Contributing

Contributions are welcome. Please open an issue first to discuss a change, then submit a pull request from a feature branch.

## Licence

This project is for the Better Health app. Add a licence file if one is required before wider distribution.
