var wsId = Math.floor(Math.random() * 2000000000)
var betting = new WebSocket("ws://127.0.0.1:5000/ws/betting/0/" + wsId)


betting.onmessage = function (event) {
    var msg = JSON.parse(event.data)
    console.info(msg)

    document.getElementById("currentBet").innerHTML = msg;
}

function action(value) {
    var msg = value.toString()

    console.log(msg)

    betting.send(msg)
}