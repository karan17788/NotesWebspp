# Notely — Full Stack Notes App

A responsive notes app with a React frontend, Express API, and MongoDB storage.

## What's included
- `notesapp/` — Express API, authentication, and Mongoose models for users and notes.
- `frontend/` — React + Vite app with login, registration, note management, search, categories, and responsive layout.
- Notes are saved in MongoDB in the `notes` collection and associated with the signed-in user.
- Existing browser-stored notes are imported into MongoDB at sign-in if that user's database has no notes yet.
- `render.yaml` — Render Blueprint for deploying the API and frontend together.

## Deploy frontend and backend on Render

1. Push this repository to GitHub and make sure your MongoDB database is reachable from Render. For MongoDB Atlas, create a database user with only the permissions the app needs and allow Render's outbound connections in Atlas Network Access.
2. In Render, choose **New → Blueprint**, connect `karan17788/NotesWebspp`, and select the `main` branch.
3. Review the two services in `render.yaml` and create the Blueprint. When prompted, enter `MONGO_URI` using the MongoDB Atlas connection string. Use the correct database name in that URI.
4. Render generates `JWT_SECRET` and connects the frontend API URL and backend CORS origin automatically. Wait for both services to finish deploying.
5. Open the frontend's `onrender.com` URL, register, and sign in. The backend health endpoint is `/health`.

The free backend service can sleep after inactivity, so its first request after a pause may take longer. The web service and static frontend are separate Render services; the Blueprint wires their URLs together.

## Run locally on Windows

### 1. Configure and run the backend
Create `notesapp\.env` with your MongoDB connection string:

```text
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
```

Never commit or share the real `.env` file. Install dependencies and start the API:

```powershell
cd notesapp
npm install
npm run server
```

The backend runs on `http://localhost:8080`.

### 2. Run the frontend
Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`. The development proxy forwards API requests to the local backend.

## Notes
- Register an account first, then sign in.
- Keep the backend terminal running while using the app.
- The browser keeps a local copy for convenience, but MongoDB is the source of truth for notes.
- Existing login tokens are cleared if the backend rejects them; sign in again to continue.
