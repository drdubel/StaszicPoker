function createGame(minBet) {
    var wsId = Math.floor(Math.random() * 2000000000)
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/create/" + wsId)
    var msg = JSON.stringify({ "minBet": minBet })

    ws.onopen = function () {
        ws.send(msg);
    }
}


function joinGame(gameId) {
    var wsId = Math.floor(Math.random() * 2000000000)
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/join/" + gameId + "/" + wsId)
    var msg = JSON.stringify({ "buyIn": 1000 })

    ws.onopen = function () {
        ws.send(msg);
        window.location.href = "http://127.0.0.1:8000/poker";
    };
}