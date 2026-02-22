# Energy Efficiency Audit - Backend

## Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoint

**POST** `/api/audit`

- Accepts `multipart/form-data`
- Fields:
  - `file` — CSV or PKL file
  - `epochs` — integer (default: 1)

- Returns: JSON audit result

## CORS

Configured to allow requests from the Lovable frontend preview.
