# Notely — Full Stack Notes App

A responsive notes app with a React frontend, Express API, and MongoDB storage.

## What's included
- `notesapp/` — Express API, authentication, and Mongoose models for users and notes.
- `frontend/` — React + Vite app with login, registration, note management, search, categories, and responsive layout.
- Notes are saved in MongoDB in the `notes` collection and associated with the signed-in user.
- Existing browser-stored notes are imported into MongoDB at sign-in if that user's database has no notes yet.
- `render.yaml` — Render Blueprint for deploying the API and frontend together.

## Deploy frontend on Netlify and backend on Render

1. Make sure MongoDB Atlas accepts connections from Render and that the Atlas database user credentials are current.
2. Deploy the `notesapp/` service on Render from `render.yaml`. Set `MONGO_URI` to the connection string only (starting with `mongodb+srv://`); do not include `MONGO_URI=` or quotes, and never commit it. Render generates `JWT_SECRET`.
3. Deploy the frontend on Netlify using the repository root configuration in `netlify.toml`. Set the Netlify build environment variable `VITE_API_BASE_URL` to `https://noteswebspp-karan17788-api.onrender.com`.
4. Ensure the Render API's `CORS_ORIGIN` includes the frontend origin (`https://noteswebspp-karan17788-frontend.onrender.com`; add `https://notely-noteswebspp-karan17788.netlify.app` too if using the Netlify copy).
5. Check the API health endpoint at `/health`, then register and sign in on the Netlify site.

The free Render backend can sleep after inactivity, so its first request after a pause may take longer.

## Run locally on Windows

### 1. Configure and run the backend
Create `notesapp\.env` with your MongoDB connection string:

```text
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
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
