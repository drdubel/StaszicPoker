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
var yourId
document.getElementById("currentBet").innerHTML = 0
document.getElementById("currentPot").innerHTML = 0
document.getElementById("yourCurrentBet").innerHTML = 0


betting.onmessage = function (event) {
    var msg = JSON.parse(event.data).replace(/'/g, '"')
    console.log(msg)

    if (msg[0] == "B") {
        document.getElementById("currentBet").innerHTML = msg.substring(1)
    } else if (msg[0] == "C") {
        msg = JSON.parse(msg.substring(1))
        console.log(msg)

        document.getElementById("currentChips").innerHTML = msg[yourId]
    } else if (msg[0] == "D") {
        console.log(msg.substring(1))
        msg = JSON.parse(msg.substring(1))

        for (let i = 1; i <= msg.length; i++)
            document.getElementById("card" + i.toString()).src = "/static/cards/" + msg[i - 1] + ".png"
    } else if (msg[0] == "E") {
        winningOrder = JSON.parse(msg.substring(1))
        console.log(winningOrder)

        document.getElementById("currentPlayer").innerHTML = "Game Over"
        document.getElementById("currentBet").innerHTML = 0
        document.getElementById("currentPot").innerHTML = 0
        document.getElementById("yourCurrentBet").innerHTML = 0
        document.getElementById("winningOrder").innerHTML = winningOrder
        document.getElementById("winningOrderHeader").style.display = "block"
        document.getElementById("nextRound").style.display = "block"
    } else if (msg[0] == "G") {
        if (msg.substring(1) == yourId)
            document.getElementById("currentPlayer").innerHTML = "Your turn"
        else
            document.getElementById("currentPlayer").innerHTML = msg.substring(1)
    } else if (msg[0] == "M") {
        msg = JSON.parse(msg.substring(1))

        document.getElementById("yourCurrentBet").innerHTML = msg[yourId]
    } else if (msg[0] == "N") {
        msg = JSON.parse(msg.substring(1))

        document.getElementById("winningOrderHeader").style.display = "none"
        document.getElementById("nextRound").style.display = "none"

        for (let i = 1; i <= msg.length; i++)
            document.getElementById("playerCard" + i.toString()).src = "/static/cards/" + msg[i - 1] + ".png"
    } else if (msg[0] == "P") {
        document.getElementById("currentPot").innerHTML = msg.substring(1)
    } else if (msg[0] == "Y") {
        yourId = msg.substring(1)
    }
}

function nextRound() {
    betting.send('"N"')
}

function action(value) {
    var msg = value.toString()

    console.log(msg)

    betting.send(msg)
}