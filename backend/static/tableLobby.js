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
gameId = 0

var ws = new WebSocket("ws://127.0.0.1:8000/ws/start/" + gameId + "/" + wsId);

ws.onmessage = function (event) {
    var msg = JSON.parse(event.data)
    console.log(msg)

    if (msg == "0") {
        window.location.href = "http://127.0.0.1:8000/poker/" + gameId
    }
}

function startGame() {
    var msg = "start"
    ws.send(msg);
}