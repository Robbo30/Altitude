from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database

app = FastAPI()
database.setup()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "hello from Altitude"}

@app.get("/player")
def get_player():
    conn = database.connect()
    player = conn.execute("SELECT * FROM players WHERE id = 1").fetchone()
    owned = conn.execute("SELECT item_id FROM owned_items WHERE player_id = 1").fetchall()
    conn.close()
    return {
        "altitude_m": player["altitude_m"],
        "coins": player["coins"],
        "metres_per_minute": 40,
        "owned": [row["item_id"] for row in owned],
        "outfit": {"hat": player["hat"], "suit": player["suit"]},
        "active_climb": None,
    }