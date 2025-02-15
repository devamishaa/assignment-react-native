# Timer Management App

A React Native application for managing multiple timers with categories, progress tracking, and history.

## Features

- Create and manage multiple timers
- Group timers by categories
- Bulk actions for category-wide timer control
- Progress visualization
- Timer history tracking
- Customizable halfway alerts
- Persistent storage

## Setup Instructions

1. Prerequisites:
   - Node.js 16 or higher
   - npm or yarn
   - Expo CLI (`npm install -g expo-cli`)

2. Installation:
   ```bash
   npm install
   ```

3. Running the app:
   ```bash
   npm run dev
   ```

## Development Assumptions

1. Data Persistence:
   - Uses AsyncStorage for local data storage
   - Timer data persists between app sessions
   - History is stored locally

2. Timer Behavior:
   - Timers continue running in the background
   - Halfway alerts trigger at exactly 50% of duration
   - Multiple timers can run simultaneously

3. User Interface:
   - Mobile-first design
   - Support for both light and dark mode
   - Touch-friendly controls

4. Categories:
   - User-defined categories
   - No limit on number of categories
   - Categories are created on-the-fly when adding timers

5. Performance:
   - Optimized for handling multiple concurrent timers
   - Efficient category-based grouping
   - Smooth animations and transitions

## Technical Details

- Built with React Native and Expo
- Uses Expo Router for navigation
- TypeScript for type safety
- AsyncStorage for data persistence