import sqlite3

DB_PATH = "altitude.db"

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def setup():
    conn = connect()
    conn.execute("""CREATE TABLE IF NOT EXISTS players (
                    id INTEGER PRIMARY KEY,
                    altitude_m REAL NOT NULL DEFAULT 0,
                    coins INTEGER NOT NULL DEFAULT 0,
                    hat TEXT NOT NULL DEFAULT "beanie",
                    suit TEXT NOT NULL DEFAULT "trail"
            )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS owned_items (
            player_id INTEGER NOT NULL,
            item_id TEXT NOT NULL,
            PRIMARY KEY (player_id, item_id)
        )
    """)
    if conn.execute("SELECT COUNT(*) FROM players").fetchone()[0] == 0:
        conn.execute("INSERT INTO players (id) VALUES (1)")
        conn.executemany(
            "INSERT INTO owned_items (player_id, item_id) VALUES (1, ?)",
            [("beanie",), ("trail",)],
        )
    conn.commit()
    conn.close()