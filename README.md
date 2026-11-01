# Altitude

A pixel-art focus timer. Your hiker climbs while you work, from the fields of Britain towards the Moon. Going higher earns coins to spend on outfits.

## Layout

- `frontend/`: screens, pixel art and animations
- `backend/`: FastAPI app, database and game logic

## Run the frontend

The frontend runs on sample data until the backend exists.

```bash
python -m http.server 5173 --directory frontend
```

Then open http://localhost:5173.

## Connect the backend

Set `API_URL` at the top of `frontend/js/api.js` to your server's address. The frontend then uses the endpoints listed in `backend/README.md`.
