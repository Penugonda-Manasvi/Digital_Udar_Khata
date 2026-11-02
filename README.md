# Digital Udhar Khata (React + Vite + Express + MongoDB Atlas)

Credit ledger for small shops. Same screens and styling as the Firebase version;
only the data layer changed:

| Before (Firebase)            | Now                                   |
|------------------------------|---------------------------------------|
| Firebase Auth                | Email + password with JWT (bcrypt)    |
| Firestore `customers`        | MongoDB `customers` collection        |
| Firestore `transactions`     | MongoDB `transactions` collection     |
| `onSnapshot` live updates    | REST API + refetch after every change |

```
digital-udar-khata/
├── client/   React + Vite app (same pages and CSS as before)
└── server/   Express API + Mongoose models
```

## 1. Create the MongoDB Atlas database (free)

1. Sign in at https://cloud.mongodb.com and create a **free (M0) cluster**.
2. **Database Access** → Add Database User → choose a username and password (avoid `@ : /` in the password).
3. **Network Access** → Add IP Address → add your current IP (or `0.0.0.0/0` while testing).
4. **Database → Connect → Drivers** → copy the connection string.

## 2. Configure the server

```bash
cd server
copy .env.example .env      # Windows (use cp on Mac/Linux)
```

Edit `server/.env`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/udhar_khata?retryWrites=true&w=majority
JWT_SECRET=<a long random string>
```

The `udhar_khata` database and its collections are created automatically on first use.

## 3. Install and run

From the project root:

```bash
npm install                # installs "concurrently"
npm run install-all        # installs server + client packages
npm run dev                # starts API on :5000 and the app on :5173
```

Or run them separately: `cd server && npm run dev` and `cd client && npm run dev`.

Open http://localhost:5173, register an account, and add customers.

## API (all routes except /auth/* need `Authorization: Bearer <token>`)

```
POST   /api/auth/register          { email, password }
POST   /api/auth/login             { email, password }
GET    /api/auth/me

GET    /api/customers              POST /api/customers        { name, phone }
GET    /api/customers/:id          PUT  /api/customers/:id    { name, phone }
DELETE /api/customers/:id          (also deletes its transactions)

GET    /api/transactions?customerId=
POST   /api/transactions           { customerId, type, amount, date, note }
PUT    /api/transactions/:id       { type, amount, date, note }
DELETE /api/transactions/:id
```

Every query is filtered by the logged-in user, so shopkeepers only see their own data.

## Deploying later

- **Backend** (Render / Railway): root `server`, start command `npm start`, set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL). In Atlas Network Access, allow `0.0.0.0/0`.
- **Frontend** (Vercel / Netlify): root `client`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<your-backend-url>`.

## Notes

- Old Firebase data is not migrated. The old Firebase keys are no longer used; you can delete the Firebase project.
- Never commit `server/.env` (it is in `.gitignore`).
