function joinGame(gameId) {
    var wsId = Math.floor(Math.random() * 2000000000)
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/join/" + gameId + "/" + wsId)
    ws.send(JSON.stringify({ "buyIn": 1000 }))
    window.location.href = 'http\:\/\/127.0.0.1:8000/poker'
}