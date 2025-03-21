function getCookies() {
    var cookies = document.cookie.split(';')
    var cookieDict = {}
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split('=')
        cookieDict[cookie[0].trim()] = cookie[1]
    }
    return cookieDict
}


wsId = getCookies()['wsId']

function createGame(tableName, minBet) {
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/create/" + wsId)
    var msg = JSON.stringify({ "tableName": tableName, "minBet": minBet })

    ws.onopen = function () {
        ws.send(msg);
    }
}


function joinGame(gameId) {
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/join/" + gameId + "/" + wsId)
    var msg = JSON.stringify({ "buyIn": 1000 })

    ws.onopen = function () {
        ws.send(msg);
        window.location.href = "http://127.0.0.1:8000/tableLobby/" + gameId;
    };
}