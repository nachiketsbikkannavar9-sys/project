# RAPID CRISES SYSTEM Platform

RAPID CRISES SYSTEM is a modern, responsive, and robust disaster management and crisis response platform. It aims to empower civilians to broadcast distress signals effectively and provides authorities with real-time mapping, triage capabilities, and situational awareness.

## 🚀 Features

- **Real-Time SOS Reporting**: Let users quickly drop a pin and send an SOS alert.
- **Geofencing & Zoning**: Dedicated tools for authorities to coordinate danger zones and safe points.
- **Triage Dashboard**: A command center showing active alerts, responder status, and metrics.
- **Interactive Map**: Powered by Leaflet for dynamic rendering of alerts and zones.

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS v4, React-Leaflet
- **Backend:** FastAPI, Python 3, Uvicorn (REST API)
- **Deployment:** Render (configured via `render.yaml`)

## 📂 Project Structure

```text
📦 project
 ┣ 📂 backend       # FastAPI server, API routes, data models
 ┣ 📂 frontend      # React Vite app, UI components, mapped views
 ┣ 📜 .gitignore    # Ignore rules for git
 ┣ 📜 render.yaml   # Render deployment configuration
 ┗ 📜 README.md     # This documentation
```

## ⚙️ Getting Started

To run the application locally, you will need Node.js and Python 3 installed.

### 1. Run the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The FastAPI backend will start running. You can view the API documentation at the provided local address.

### 2. Run the Frontend

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start. Open the displayed local URL in your browser to view the app!

