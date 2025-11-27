# Timesheet Pro

A stunning, modern timesheet application for tracking work hours with Polish holidays support, built with React, Tailwind CSS, and Firebase.

## Features

- **Beautiful UI/UX**: Modern, minimalistic design with glassmorphic effects and smooth animations
- **Mobile-First**: Fully responsive design that looks great on all devices
- **Polish Holidays**: Automatic detection and highlighting of Polish national holidays
- **Activity Tracking**: Track different activities (LinkedIn Stuff, Paid Vacation, etc.)
- **Hour Logging**: Easy hour selection with visual slider (0-12 hours)
- **Month Navigation**: Browse through different months with ease
- **Data Export**: Export timesheet data as CSV
- **Storage Options**: 
  - Local storage (default) - data stored in browser
  - Firebase cloud storage (optional) - sync across devices
- **Visual Indicators**: Different colors for weekends, holidays, and today
- **Real-time Statistics**: View total hours and daily average

## Live Demo

Visit: [Your Netlify URL will appear here after deployment]

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/andriybobchuk/timesheet-app.git
cd timesheet-app
npm install
```

### 2. Local Development
```bash
npm run dev
```
Visit http://localhost:5173

### 3. Firebase Setup (Optional - for cloud storage)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to Project Settings > General
4. Under "Your apps", click "Add app" and select Web (</>)
5. Register your app and copy the configuration
6. Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

7. In Firebase Console, go to Firestore Database
8. Create database in production mode
9. Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timesheets/{document} {
      allow read, write: if true;
    }
  }
}
```

### 4. Deploy to Netlify

#### Option A: Deploy with Git (Recommended)

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" > "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables (if using Firebase):
   - Go to Site Settings > Environment Variables
   - Add all VITE_FIREBASE_* variables from your .env file
7. Click "Deploy site"

#### Option B: Manual Deploy

1. Build the project locally:
```bash
npm run build
```
2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```
3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

## Usage

1. **Select a Day**: Click on any day in the calendar
2. **Choose Activity**: Select "LinkedIn Stuff" or "Paid Vacation"
3. **Set Hours**: Use the slider to set hours (0-12)
4. **Save**: Click Save to record your entry
5. **Export Data**: Click the download icon to export current month as CSV
6. **Toggle Storage**: Click cloud icon to switch between local/cloud storage

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Framer Motion (animations)
- date-fns (date handling)
- Firebase (optional cloud storage)
- Lucide React (icons)

## Color Legend

- 🔵 Blue/Cyan: Weekend days
- 🟣 Purple/Pink: Polish holidays
- 🟡 Amber/Orange: Today
- 🟢 Green: Logged hours

## Project Structure

```
src/
├── components/
│   ├── DayCard.jsx         # Individual day component
│   ├── ActivityModal.jsx   # Modal for activity selection
│   └── MonthHeader.jsx     # Month navigation header
├── utils/
│   └── holidays.js         # Polish holidays calculation
├── hooks/
│   └── useFirestore.js     # Firebase integration hook
├── config/
│   └── firebase.js         # Firebase configuration
└── App.jsx                 # Main application component
```

## License

MIT

## Author

Created for LinkedIn Assistant timesheet tracking