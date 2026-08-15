# 🚌 Bus Tracker & Crowd Prediction App 2.0

A real-time bus tracking and crowd prediction web application designed to help passengers track buses, view routes and stops, estimate arrival times, and understand current and predicted crowd levels.

The project is being developed as a modular system with a frontend, Node.js backend, database layer, and a future Python-based machine-learning prediction service.

---

## 🚀 Features

### Current Features

* Google Maps integration
* Bus route selection
* Route visualization
* Bus stop markers
* Simulated live bus movement
* Current bus status
* Current and next stop display
* Backend health API
* Frontend ↔ backend communication

### Planned Features

* Real GPS tracking from driver devices
* Real-time bus location updates
* ETA calculation
* Passenger occupancy tracking
* Historical crowd-data storage
* Crowd prediction using machine learning
* Passenger dashboard
* Driver/conductor dashboard
* Admin dashboard
* Analytics and prediction accuracy tracking
* Deployment to the internet

---

# 🛠️ Technology Stack

| Component               | Technology                 |
| ----------------------- | -------------------------- |
| Frontend                | HTML, CSS, JavaScript      |
| Maps                    | Google Maps JavaScript API |
| Backend                 | Node.js + Express          |
| Real-time communication | Socket.IO                  |
| Database                | MongoDB                    |
| Machine Learning        | Python                     |
| ML API                  | FastAPI                    |
| Version Control         | Git + GitHub               |
| Development             | VS Code                    |

---

# 📁 Project Structure

```text
Bus-Tracker-and-Crowd-Prediction-App-2.0/
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── data/
│   │   └── routes.js
│   │
│   ├── js/
│   │   ├── app.js
│   │   └── config.js        # Local only - NOT pushed to GitHub
│   │
│   └── index.html
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── ml/
│   ├── data/
│   ├── models/
│   └── prediction.py
│
├── database/
│
├── docs/
│
├── .gitignore
└── README.md
```

---

# 💻 Requirements

Before running the project, install:

* Git
* Node.js
* npm
* VS Code
* A modern web browser
* A Google Maps Platform API key

Python and MongoDB will be required when the machine-learning and database components are implemented.

---

# 📥 Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
```

Enter the project:

```bash
cd Bus-Tracker-and-Crowd-Prediction-App-2.0
```

---

# 📦 Backend Setup

Open a terminal inside the project and enter:

```bash
cd backend
```

Install the backend dependencies:

```bash
npm install
```

The required packages are defined in `package.json`, so another developer does not need to manually install Express, CORS, etc. one by one.

---

# 🔑 Google Maps API Setup

## Important

The Google Maps API key is intentionally **not included in this repository**.

Each developer must create and use their own Google Maps API key.

This prevents the repository owner from exposing a personal API key.

---

## 1. Create a Google Maps API key

Go to:

https://console.cloud.google.com/

Create or select a Google Cloud project.

Enable the Google Maps JavaScript API for the project and create an API key.

---

## 2. Configure the API key

Inside:

```text
frontend/js/
```

create a new file named:

```text
config.js
```

The file should contain:

```javascript
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
```

Replace:

```text
YOUR_GOOGLE_MAPS_API_KEY
```

with your own Google Maps API key.

### Example

```javascript
const GOOGLE_MAPS_API_KEY = "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
```

Do **not** publish this file to GitHub.

The repository already ignores it through `.gitignore`:

```gitignore
frontend/js/config.js
```

---

# 🔐 API Key Security

For development, restrict the Google Maps API key to the websites you actually use.

For example:

```text
http://localhost:5500/*
http://127.0.0.1:5500/*
```

When the application is deployed, replace/add the production domain.

Also restrict the key to the Google APIs required by the application.

Never commit your API key into:

```text
index.html
app.js
routes.js
README.md
```

or any other tracked file.

---

# ▶️ Running the Backend

From:

```text
backend/
```

run:

```bash
node server.js
```

You should see:

```text
Server running at http://localhost:5000
```

Test the backend:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Bus Tracker API is running!"
}
```

---

# 🌐 Running the Frontend

Do not open `index.html` directly with:

```text
file:///
```

Instead, serve the frontend through a local HTTP server.

One easy method in VS Code is the **Live Server** extension.

Open:

```text
frontend/index.html
```

and select:

```text
Go Live
```

The application should open at an address similar to:

```text
http://127.0.0.1:5500/frontend/index.html
```

---

# 🚌 Using the Current Demo

After starting both the backend and frontend:

1. Open the application.
2. Select a route from the route selector.
3. The route will appear on Google Maps.
4. Bus stops will be displayed.
5. A simulated bus will move between stops.
6. Current and next stop information will update.

Available demo routes currently include:

```text
D-3
G-3
R-4
```

The route coordinates are currently demo/test data and are not intended to represent official transit routes.

---

# 🔄 Current System Architecture

```text
                 ┌──────────────────────┐
                 │      Passenger       │
                 │      Frontend        │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │     Node.js /        │
                 │     Express API      │
                 └──────────┬───────────┘
                            │
                 ┌──────────┴───────────┐
                 ↓                      ↓
          Route / Bus Data        Future ML Service
```

---

# 🚧 Development Roadmap

## Phase 1 — Foundation

* Project structure
* Node.js backend
* Express API
* Frontend/backend connection

## Phase 2 — Map System

* Google Maps
* Routes
* Stops
* Bus markers
* Route visualization

## Phase 3 — Simulated Tracking

* Moving bus
* Current stop
* Next stop
* ETA simulation

## Phase 4 — Real GPS

* Driver GPS
* Trip start/end
* Location updates
* Live bus tracking

## Phase 5 — Real-Time System

* Socket.IO
* Live location broadcasting
* Automatic map updates

## Phase 6 — Crowd System

* Passenger count
* Bus capacity
* Occupancy percentage
* Crowd classification

## Phase 7 — Database

* Buses
* Routes
* Stops
* Trips
* Historical crowd data

## Phase 8 — Machine Learning

* Data preprocessing
* Feature engineering
* Model training
* Crowd prediction
* Model evaluation

## Phase 9 — ML API

* Python/FastAPI prediction service
* Node.js ↔ Python communication
* Real-time predictions

## Phase 10 — Dashboards

* Passenger dashboard
* Driver/conductor dashboard
* Admin dashboard

## Phase 11 — Deployment

* Frontend hosting
* Backend hosting
* Database hosting
* ML API deployment
* Production API-key restrictions

---

# 🤝 Contributing

1. Fork the repository.
2. Clone your fork.
3. Create a new branch.

```bash
git checkout -b feature/my-feature
```

4. Make your changes.
5. Test the application.
6. Commit your changes.

```bash
git add .
git commit -m "Add my feature"
```

7. Push the branch.

```bash
git push origin feature/my-feature
```

8. Open a Pull Request.

---

# ⚠️ Important Git Rules

Never commit:

```text
frontend/js/config.js
.env
.env.*
node_modules/
```

The Google Maps API key belongs to the individual developer running the project.

Before pushing code, check:

```bash
git status
```

Make sure `config.js` is not included in the files being committed.

---

# 📄 License

Add the project's chosen license here before public distribution.

---

# 👨‍💻 Project Status

**Current stage:** Early development

The basic backend, frontend connection, Google Maps integration, route visualization, and simulated bus tracking are currently implemented.

The system is actively being developed toward real-time GPS tracking and machine-learning-based crowd prediction.
