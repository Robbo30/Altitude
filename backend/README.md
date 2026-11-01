# Backend

FastAPI and SQLite. All JSON. Times are ISO 8601 in UTC.

## Build these first

### `GET /player`

```json
{
  "altitude_m": 3918,
  "coins": 1280,
  "metres_per_minute": 40,
  "owned": ["beanie", "trail"],
  "outfit": { "hat": "beanie", "suit": "trail" },
  "active_climb": null
}
```

`active_climb` is `null`, or the same object that `POST /climbs/start` returns.

### `POST /climbs/start`

Send:

```json
{ "task": "Maths revision", "minutes": 25 }
```

Returns:

```json
{
  "id": 1,
  "task": "Maths revision",
  "minutes": 25,
  "started_at": "2026-11-01T12:00:00Z",
  "paused_at": null,
  "paused_seconds": 0
}
```

### `POST /climbs/finish`

Works out how long the climb really lasted from the saved times. Never trust a duration sent by the browser.

```json
{
  "focused_seconds": 1500,
  "metres_gained": 1000,
  "coins_earned": 150,
  "altitude_m": 4918,
  "coins": 1430,
  "landmarks_passed": ["Mont Blanc"]
}
```

## Then these

- `POST /climbs/pause` and `POST /climbs/resume`: return the updated climb.
- `GET /shop`: returns a list of `{ "id", "slot", "name", "price" }`. `slot` is `hat` or `suit`.
- `POST /shop/buy` with `{ "item_id": "roman" }`: returns the updated player, or a 400 error if the player can't afford it.
- `POST /outfit` with `{ "hat": "roman", "suit": "trail" }`: returns the updated player.

## Rules to decide

The sample data in `frontend/js/api.js` uses 40 metres per minute, 1 coin per 10 metres and 50 bonus coins per landmark. You'll need to add a speed boost above 100 km, otherwise the Moon takes more than 18 years of non-stop focus.
