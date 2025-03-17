function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

const wsId = getCookie('access_token')
var betting = new WebSocket("ws://127.0.0.1:5000/ws/betting/420/" + wsId)


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