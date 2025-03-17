function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

const wsId = getCookie('access_token')

function joinGame(gameId) {
    var ws = new WebSocket("ws://127.0.0.1:5000/ws/" + gameId + "/" + wsId)
    ws.send("join")
    window.location.href = 'http\:\/\/127.0.0.1:8000/poker'
}