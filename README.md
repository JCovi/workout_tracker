# 🏋️‍♂️ Workout Tracker

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-6DA55F?logo=node.js&logoColor=white)]() [![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)]() [![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)]()

A minimal full-stack app to plan workouts by day.  
Frontend: vanilla HTML/CSS/JS. Backend: Express + MySQL.

---

## ✨ Features
- 📅 Days view (Mon–Fri) with expandable sections + **Expand All / Collapse All**
- ➕ Add exercises with **Sets (1–10)**, **Reps (1–20)**, **Weight (lb)**, **Rest (sec)**
- 🔄 Instant refresh of the day after adding
- 🧱 REST API: GET / POST / PUT / DELETE

---

## 🧰 Tech Stack
- **Backend:** Node.js, Express
- **Database:** MySQL 8 (local)
- **Frontend:** HTML, CSS, vanilla JS (served via `express.static`)

---

## 🚀 Local Development

### Prereqs
- Node.js 18+
- MySQL 8 running locally

### Install & Run
    npm install
    node server.js
App runs at **http://localhost:3000**

### Default local DB settings
(defined in `server.js` for quick start; will move to `.env`)
- host: `localhost`
- user: `workout_user`
- password: `<your local password>`
- database: `workout_tracker`

**Schema (created earlier)**
- `days` — `id`, `name`, `position`
- `exercises` — `id`, `day_id`, `name`, `sets`, `reps`, `weight_lbs`, `rest_seconds`, `position`, timestamps

---

## 🔌 API (summary)

### Days
- **GET** `/days` → list all days (Mon–Fri)

### Exercises
- **GET** `/exercises?day_id={id}` → list exercises for a day
- **POST** `/exercises` (JSON)
      {
        "day_id": 1,
        "name": "Dumbbell Bench Press",
        "sets": 3,
        "reps": 10,
        "weight_lbs": 70,
        "rest_seconds": 90,
        "position": 1
      }
- **PUT** `/exercises/:id` → partial update (e.g., `{ "reps": 12 }`)
- **DELETE** `/exercises/:id`

---

## 🗂️ Project Structure
    .
    ├─ public/              # frontend assets
    │  ├─ index.html
    │  ├─ styles.css
    │  └─ app.js
    ├─ server.js            # Express server + routes
    ├─ package.json
    └─ README.md

---

## 🛣️ Roadmap
- ✏️ Edit/Delete exercise rows in UI
- 🔐 Move DB config to `.env` via `dotenv`
- ☁️ Deploy to Vercel (frontend) + server host (Render/Fly/railway) or single host

---

## 🤝 Contributing
PRs welcome. Keep `main` stable; use feature branches.

## 📄 License
MIT
