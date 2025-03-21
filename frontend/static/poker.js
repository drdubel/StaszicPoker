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
var betting = new WebSocket("ws://127.0.0.1:5000/ws/betting/0/" + wsId)


betting.onmessage = function (event) {
    var msg = JSON.parse(event.data)
    console.info(msg)

    if (msg == "S") {
        document.getElementById("currentPlayer").innerHTML = "Your Turn"
    } else {
        document.getElementById("currentBet").innerHTML = msg
    }
}

function action(value) {
    var msg = value.toString()

    console.log(msg)

    betting.send(msg)
    document.getElementById("currentPlayer").innerHTML = "Not your turn"
}