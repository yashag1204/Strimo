# Strimo - Cinematic Media Streaming Platform

Strimo is a high-performance, Netflix-inspired media streaming application built with **React.js (ES6+)**, **Tailwind CSS 4**, and **Firebase**. It features a polished UI, offline support, and real-time synchronization across devices.

## 🚀 Key Features

- **Cinematic UI**: A premium dark-themed interface with dynamic hero sections, staggered row animations, and Netflix-style "Top 10" visual indicators.
- **Shared Element Transitions**: Smooth "bigger screen" animations when opening movie previews, creating a seamless browsing experience.
- **Offline-First Architecture**:
  - **IndexedDB Caching**: All media data is cached locally using IndexedDB for instant loading and offline access.
  - **Auto-Sync**: Automatically synchronizes with the cloud when internet connectivity is restored.
- **Real-Time Watchlist & History**: Powered by Cloud Firestore, your watchlist and watch history are synced across all your devices in real-time.
- **Advanced Discovery**:
  - **Smart Search**: Debounced search by name, genre, or release year.
  - **Recommendations**: "More Like This" suggestions based on genres.
  - **Trending Rows**: Curated rows for Trending, Action, Comedy, and more.
- **Robust Authentication**: Secure Google Sign-In and Guest Login integration.
- **Performance Optimized**: 
  - Lazy loading for infinite scroll.
  - Debounced search to minimize API calls.
  - Memoized components to prevent unnecessary re-renders.

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vanilla JavaScript ES6+)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (formerly Framer Motion)
- **Routing**: React Router 7
- **Database**: Cloud Firestore (Real-time), IndexedDB (Local Cache via `idb`)
- **Auth**: Firebase Authentication (Google & Anonymous)
- **Icons**: Lucide React
- **API**: TVMaze API (Media Metadata)
- **HTTP Client**: Axios

## 📋 Requirements

To run this project locally, you will need:

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Firebase Account**: To set up your own Firestore and Auth instances.

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd strimo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   Create a `firebase-applet-config.json` in the root directory with your Firebase credentials:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_AUTH_DOMAIN",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_STORAGE_BUCKET",
     "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
     "appId": "YOUR_APP_ID",
     "firestoreDatabaseId": "(default)"
   }
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `src/components`: Reusable UI components (Layout, ErrorBoundary, etc.)
- `src/pages`: Main application views (Home, Search, Profile, Auth)
- `src/lib`: Core libraries (Firebase, IndexedDB, Utils)
- `src/services`: External API integrations
- `firestore.rules`: Security rules for database protection

## 🛡️ Security

Strimo implements strict Firestore Security Rules to ensure:
- Users can only read/write their own watchlist and history.
- Data integrity is maintained through schema validation.
- PII (Personally Identifiable Information) is protected.

---
Developed with ❤️ by the Strimo Team.
