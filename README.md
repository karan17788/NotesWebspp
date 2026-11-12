# Notely — Full Stack Notes App

A responsive notes app with a React frontend, Express API, and MongoDB storage.

## What's included
- `notesapp/` — Express API, authentication, and Mongoose models for users and notes.
- `frontend/` — React + Vite app with login, registration, create/edit/delete notes, search, pinning, categories, dashboard statistics, dark mode, JSON export, and responsive layout.
- Notes are saved in MongoDB in the `notes` collection and associated with the signed-in user.
- Existing browser-stored notes are imported into MongoDB at sign-in if that user's database has no notes yet.

## Run on Windows

### 1. Configure the backend
Create `notesapp\.env` and add your MongoDB connection string:

```text
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
```

For MongoDB Compass, connect to the same MongoDB server and open the database named in your connection string. Notes appear in its `notes` collection; users appear in `users`. Never commit or share your real `.env` file.

Install backend dependencies (first run only) and start the API:

```powershell
cd notesapp
npm install
npm run server
```

The backend runs on `http://localhost:8080`.

### 2. Start the frontend
Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`. Its development proxy forwards `/user`, `/dashboard`, and `/notes` requests to the backend.

## Notes
- Register an account first, then sign in.
- Keep the backend terminal running while using the app.
- The browser keeps a local copy for convenience, but MongoDB is the source of truth for notes.
- Existing login tokens are cleared if the backend rejects them; sign in again to continue.
