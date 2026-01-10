# Codebase Explanation and Scalability Guide

This document explains the structure of your **INDRA** application, how the different parts connect, and why the current design is scalable and ready for future growth (including migration to Cloud Functions).

## 1. Project Structure

We have refactored the project to follow the **Industry Standard Vite/React** structure. This ensures better tool compatibility, effortless build processes, and a clean separation of concerns.

```
frontend/
├── src/                  # All source code lives here
│   ├── lib/              # Business logic & Database interactions (The "Brain")
│   ├── pages/            # Page components (The "Views")
│   ├── components/       # Reusable UI components (Buttons, Loaders, Layouts)
│   ├── context/          # Global State (Auth, Theme)
│   ├── assets/           # Images, static files
│   ├── App.jsx           # Main Router setup
│   └── main.jsx          # Entry point
├── public/               # Static assets served directly
└── ... config files
```

### Why this structure?

- **`src/lib`**: This is your "Service Layer". It contains pure JavaScript functions that talk to Firebase. It **does not** contain UI code (JSX). This separation is critical for scalability.
- **Moving Logic**: Because `lib/reports.js` doesn't know about buttons or divs, you can copy-paste its logic into a Cloud Function with almost no changes.

## 2. Key Files and Responsibilities

### `src/lib/reports.js` (The Reporting Engine)

- **Role**: Manages the lifecycle of a disaster report.
- **Key Concepts**:
  - `REPORT_STATUSES`: Defines the valid states (`submitted` -> `reviewed` -> `working` -> `resolved`).
  - `createCitizenReport`: Creates a document in the `reports` collection.
  - `subscribeTo...`: Sets up real-time listeners.
- **Scalability Note**: Currently, the client decides the initial status. In the future, you will move `createCitizenReport` to a Cloud Function to validate data before saving. The file is already commented to show exactly where this split happens.

### `src/lib/userProfile.js` (User Management)

- **Role**: Ensures every logged-in user has a corresponding document in the `users` Firestore collection.
- **Key Function**: `ensureUserProfile`
  - When a user signs in, we check if they exist in the database.
  - If not, we create them with a default role (e.g., `citizen`).
- **Future Migration**: This `ensureUserProfile` logic is the perfect candidate for a **Firebase Auth Trigger** (`functions.auth.user().onCreate`). Moving it to the backend ensures that _no user_ can be created without a profile, even if they bypass the frontend.

### `src/lib/auth.js` (Authentication Wrapper)

- **Role**: Wraps Firebase Auth methods.
- **Why**: Instead of calling `signInWithPopup` everywhere in your UI, you call `signInWithGoogle`. If you change your auth provider later, you only update this one file.

### `src/context/AuthContext.jsx` (The Glue)

- **Role**: It watches `auth.js` for login/logout events.
- **Logic**:
  - When a user logs in, it fetches their profile from Firestore using `userProfile.js`.
  - It makes the `user` and `profile` data available to the entire app.
  - It handles **Protecting Routes** (redirecting operators to dashboards, citizens to home).

## 3. How Components Communicate

The flow of data in your app follows a **Unidirectional Data Flow**:

1.  **User Action**: User clicks "Submit Report" in `ReportCreate.jsx`.
2.  **Service Call**: The component calls `createCitizenReport` from `src/lib/reports.js`.
3.  **Database Update**: The function writes to Firestore.
4.  **Real-time Update**: Firestore pushes the new data to all listeners.
5.  **UI Refresh**: `ReportsList.jsx` (listening via `subscribeToCitizenReports`) automatically receives the new report and updates the list.

**There is no manual "refresh" button.** The app is reactive by default.

## 4. Scalability & Cloud Functions Strategy

Your code is **highly scalable** because:

1.  **Flat Data Structure**: Firestore collections (`users`, `reports`) are top-level. This prevents query limitations.
2.  **Logic Isolation**: You haven't mixed database calls inside your UI components (like inside `useEffect` in random files). You've put them in `lib`.

### Migration Plan (When you get Cloud Billing)

1.  **Validation**: Move the validation logic from `createCitizenReport` (Client) to a `onStart` Cloud Function.
2.  **Triggers**: Move `ensureUserProfile` to a `functions.auth.user().onCreate` trigger.
3.  **Security**: Currently, we trust the client. Later, you will write **Firestore Security Rules** that say "Only Cloud Functions can write to `status: 'reviewed'`".

## 5. Next Steps

- **Add Comments**: We are adding detailed comments to `auth.js` and `userProfile.js` right now to remind you where the future backend logic belongs.
- **Folder Structure**: We have already corrected the folder structure to match these standards.
