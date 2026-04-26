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

var ws = new WebSocket("ws://127.0.0.1:8000/ws/read/" + wsId)


const ths = document.querySelectorAll("#leaderboard thead th");

ths[0].textContent = "Position";
ths[1].textContent = "Username";
ths[2].textContent = "Victories";
ths[3].textContent = "Total Chips";
