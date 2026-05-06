# BONNYSINO Backend API

A Node.js Express backend for the BONNYSINO casino game.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### POST /spin
Spin the wheel and get results.

**Request Body:**
```json
{
  "selectedNumbers": [1, 5],
  "stake": 10
}
```

**Response:**
```json
{
  "winningNumber": 7,
  "result": "lose",
  "payout": 0,
  "stake": 10,
  "selectedNumbers": [1, 5],
  "multiplier": null
}
```

**Win Response Example:**
```json
{
  "winningNumber": 5,
  "result": "win",
  "payout": 80,
  "stake": 10,
  "selectedNumbers": [1, 5],
  "multiplier": 8
}
```

### GET /api/multipliers
Get all available multipliers.

**Response:**
```json
{
  "1": 5,
  "2": 5.5,
  "3": 6,
  "4": 7,
  "5": 8,
  "6": 10,
  "7": 12,
  "8": 15,
  "9": 20,
  "10": 25
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

## Game Logic

- **Numbers**: 1-10
- **Multipliers**: 
  - 1 = x5
  - 2 = x5.5
  - 3 = x6
  - 4 = x7
  - 5 = x8
  - 6 = x10
  - 7 = x12
  - 8 = x15
  - 9 = x20
  - 10 = x25

- **Win Condition**: Selected number matches winning number
- **Payout**: stake × multiplier (only on wins)
- **Loss**: No payout (0)

## Server Configuration

- **Port**: 3000 (or PORT environment variable)
- **CORS**: Enabled for all origins
- **Body Parser**: JSON support
- **Static Files**: Serves frontend from same directory

## Testing with curl

### Spin Request:
```bash
curl -X POST http://localhost:3000/spin \
  -H "Content-Type: application/json" \
  -d '{"selectedNumbers": [3, 7], "stake": 25}'
```

### Get Multipliers:
```bash
curl http://localhost:3000/api/multipliers
```

### Health Check:
```bash
curl http://localhost:3000/health
```

## Error Handling

- **400 Bad Request**: Invalid input parameters
- **500 Internal Server Error**: Server errors
- **404 Not Found**: Endpoint not found

## Features

- ✅ Random number generation (1-10)
- ✅ Multiplier calculation
- ✅ Win/lose determination
- ✅ Payout calculation
- ✅ Input validation
- ✅ CORS support
- ✅ Health monitoring
- ✅ Error handling
- ✅ Static file serving
