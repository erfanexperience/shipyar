# Shipyar - Peer-to-Peer Shipping Platform

A platform connecting travelers with available luggage space to shippers who need to send items.

## Project Structure

```
shipyar/
├── frontend/          # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # FastAPI application  
│   ├── app/
│   └── requirements.txt
└── README.md
```

## Development Setup

### Frontend
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs on http://localhost:8000

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.