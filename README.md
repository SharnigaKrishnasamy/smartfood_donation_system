# Harvest Link — Smart Food Donation & Waste Reduction Platform

A full-stack, LAN-first platform connecting **Donors**, **NGOs**, **Volunteers**, and **Admins**
to rescue surplus food in real time — no cloud services, no internet dependency. Everything runs
on one laptop; other devices on the same Wi-Fi/hotspot connect to it directly.

---

## 1. Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Axios · Leaflet/OpenStreetMap · Recharts · Socket.IO client

**Backend:** Python Flask · Flask-SQLAlchemy · Flask-JWT-Extended · Flask-SocketIO · Flask-CORS

**Database:** SQLite by default (zero setup) — swappable to MySQL with one environment variable.

---

## 2. Folder Structure

```
food-donation/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (User, Donation, FoodItem, VolunteerAssignment, ...)
│   │   ├── routes/          # REST blueprints: auth, donor, ngo, volunteer, admin, notifications, search
│   │   ├── sockets/         # Flask-SocketIO real-time event handlers
│   │   ├── utils/           # JWT/role decorators, geo distance, file uploads, notifications, audit log
│   │   ├── config.py
│   │   └── __init__.py      # app factory
│   ├── run.py                # entry point — binds to 0.0.0.0 for LAN access
│   ├── seed.py                # creates roles + sample accounts + sample donations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar/Sidebar layout, DonationCard, MapPicker, NearbyMap, etc.
│   │   ├── pages/             # Login, Register, and per-role dashboards (donor/, ngo/, volunteer/, admin/)
│   │   ├── context/           # AuthContext, ThemeContext, ToastContext, NotificationContext
│   │   ├── services/          # axios client, Socket.IO client, typed API wrappers
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts         # dev server bound to 0.0.0.0
│   └── .env.example
├── database/                  # SQLite file lives here by default
├── uploads/                   # donation & profile images, served at /uploads/...
└── docs/
```

---

## 3. Prerequisites

- **Python 3.10+** and **pip**
- **Node.js 18+** and **npm**
- All devices (laptops/phones) connected to the **same Wi-Fi network or mobile hotspot**

---

## 4. Backend Setup

```bash
cd backend
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Optional: copy and edit environment variables (works fine with defaults)
copy .env.example .env        # Windows
cp .env.example .env          # macOS/Linux

# Initialize the database, roles, and sample accounts
python seed.py

# Start the server (binds to 0.0.0.0:5000)
python run.py
```

On startup, the terminal prints both a local and a **LAN URL**, e.g.:

```
Local:   http://127.0.0.1:5000
LAN:     http://192.168.1.42:5000
```

Note the LAN URL — you may need it on the frontend if devices don't auto-detect it (see §6).

### Sample accounts created by `seed.py`

| Role       | Email                          | Password       |
|------------|---------------------------------|-----------------|
| Admin      | admin@fooddonation.local        | admin123        |
| NGO        | ngo@fooddonation.local           | ngo12345        |
| Donor      | donor@fooddonation.local         | donor123        |
| Volunteer  | volunteer@fooddonation.local     | volunteer123    |

`seed.py` is safe to re-run — it skips accounts/donations that already exist.

---

## 5. Frontend Setup

Open a **second terminal** (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

Vite prints:

```
Local:   http://localhost:5173/
Network: http://192.168.1.42:5173/
```

Open the **Network** URL on your laptop, and on any phone/laptop connected to the same Wi-Fi/hotspot.

---

## 6. LAN Access — Connecting Other Devices

The frontend automatically guesses the backend's address using the **same hostname you loaded the
page from**, on port 5000. This means:

- If you open `http://192.168.1.42:5173` on your phone, it will automatically try
  `http://192.168.1.42:5000` for the API — **no configuration needed** in most cases.

If that fails (e.g. a mismatched network setup), open the **login page**, click
**"Connecting from another device? Set server address"**, and paste the LAN URL the backend
printed on startup (e.g. `http://192.168.1.42:5000`). This is saved on that device only.

### Finding your laptop's LAN IP manually

- **Windows:** `ipconfig` → look for "IPv4 Address" under your Wi-Fi adapter
- **macOS:** `ipconfig getifaddr en0` (or `en1` for Wi-Fi on some Macs)
- **Linux:** `hostname -I`

### Firewall note

If other devices can't connect, your laptop's firewall may be blocking inbound connections on
ports 5000 and 5173. Allow Python and Node through your firewall, or temporarily disable it for
testing on a trusted network.

---

## 7. Switching to MySQL (optional)

By default, everything runs on SQLite (`database/food_donation.db`) with zero setup. To use MySQL:

1. Install and start a local MySQL server.
2. Create a database: `CREATE DATABASE food_donation;`
3. In `backend/.env`, set:
   ```
   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/food_donation
   ```
4. `pip install PyMySQL` (uncomment it in `requirements.txt`)
5. Re-run `python seed.py`.

---

## 8. Feature Overview

| Role       | Capabilities |
|------------|--------------|
| **Donor**     | Register/login, create donations (with photos, itemized breakdown, map-based pickup location), edit/cancel/delete pending donations, track status in real time, view history |
| **NGO**       | Browse nearby donations (list or map view, filterable by radius/category/veg), accept/skip, track a donation through pickup → delivery, view history — requires admin approval on signup |
| **Volunteer** | View available pickups near them, accept a pickup, confirm pickup and delivery, share live GPS location while en route, view history |
| **Admin**     | Platform-wide dashboard with charts (30-day trend, status breakdown), manage users (activate/deactivate/delete), approve NGOs, manage/delete donations, export CSV reports, view audit log |

**Real-time flow (Socket.IO):** donor creates donation → all NGOs notified instantly → NGO accepts →
donor notified → volunteer sees it in "available pickups" → volunteer accepts → donor & NGO notified →
pickup confirmed → delivery confirmed → everyone's dashboard updates live, no refresh needed.

---

## 9. Common Errors & Troubleshooting

| Problem | Fix |
|---|---|
| `Can't reach the server` toast on login | Backend isn't running, or the frontend guessed the wrong API address — set it manually (see §6) |
| NGO account can't log in after registering | NGO accounts need admin approval — log in as admin and approve it under **NGO Approvals** |
| Phone can't open the frontend at all | Confirm the phone is on the **same** Wi-Fi/hotspot as the laptop, and that the laptop firewall allows inbound connections on port 5173 |
| Map tiles don't load | OpenStreetMap tiles require internet access on the *viewing device* — the app itself doesn't need internet, but map tiles do (or you'll just see a blank grid) |
| `ModuleNotFoundError` on backend start | Activate the virtual environment before `pip install`, and re-run `pip install -r requirements.txt` |
| Images not showing after upload | Confirm `backend/uploads/` exists and is writable; it's created automatically on first run |
| Port already in use | Another process is using 5000 or 5173 — stop it, or change the port in `run.py` / `vite.config.ts` |
| SQLite "database is locked" | Only run one `python run.py` process at a time against the same SQLite file |

---

## 10. Security Notes (for a LAN demo/capstone context)

- Passwords are hashed with Werkzeug's `generate_password_hash` (PBKDF2).
- JWT access tokens (12h) + refresh tokens (30d) protect all non-public routes; roles are
  enforced server-side on every endpoint via `@role_required`.
- CORS and Socket.IO both allow `*` origins intentionally — this app is designed for a closed,
  trusted LAN where the host device's IP isn't known ahead of time. **Do not deploy this
  configuration to the public internet as-is.**
- File uploads are restricted by extension and 8MB size; filenames are randomized on save.
- All sensitive actions (login, donation lifecycle changes, NGO approval, deletions) are recorded
  in the `audit_logs` table, viewable by admins under **Reports**.

---

## 11. Author's Notes

This project was built module-by-module: database schema → REST APIs → auth → frontend UI →
dashboards → maps → Socket.IO → reports, with a working smoke test run after each backend module
and a full TypeScript build + type-check pass on the frontend before completion.
