import json
from hashlib import md5
from pickle import dump, load
from secrets import token_urlsafe
from typing import Optional

import structlog
from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import Cookie, FastAPI, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse

from backend.database import Database
from backend.gameLogic import Table
from backend.websocket import ws_manager

logger = structlog.get_logger()


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="!secret")
app.mount("/static", StaticFiles(directory="backend/static", html=True), name="static")

database = Database()
tables: dict[int, Table] = {}

config = Config("backend/data/.env")
oauth = OAuth(config)

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)


with open("backend/data/cookies.pickle", "rb") as cookies:
    access_cookies: dict = load(cookies)


@app.get("/")
async def homepage():
    return HTMLResponse('<a href="/login">login</a>')


@app.get("/lobby")
async def lobby():
    return FileResponse("backend/static/lobby.html")


@app.get("/tableLobby/{tableId}")
async def tableLobby():
    return FileResponse("backend/static/tableLobby.html")


@app.get("/poker/{tableId}")
async def rooms():
    return FileResponse("backend/static/poker.html")


@app.get("/login")
async def login(request: Request):
    redirect_uri = "http://127.0.0.1:8000/auth"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        return HTMLResponse(f"<h1>{error.error}</h1>")
    user = token.get("userinfo")

    if user:
        request.session["user"] = dict(user)

        wsId = md5(user["email"].encode()).hexdigest()
        print(wsId)
        access_token = token_urlsafe()
        access_cookies[access_token] = (user["email"], wsId)

        with open("backend/data/cookies.pickle", "wb") as cookies:
            dump(access_cookies, cookies)

        response = RedirectResponse(url="http://127.0.0.1:8000/lobby")
        response.set_cookie("access_token", access_token, max_age=3600 * 24 * 30)
        response.set_cookie("wsId", wsId, max_age=3600 * 24 * 30)

        return response


@app.get("/logout")
async def logout(request: Request, response: Response, access_token: Optional[str] = Cookie(None)):
    access_cookies.pop(access_token)

    with open("backend/data/cookies.pickle", "wb") as cookies:
        dump(access_cookies, cookies)

    request.session.pop("user", None)
    response.delete_cookie(key="access_token")

    return RedirectResponse(url="http://127.0.0.1:8000/")


@app.websocket("/ws/create/{wsId}")
async def createTable(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        tables[Table.tableId - 1] = Table(database, message["minBet"])

        await ws_manager.broadcast(f"C{Table.tableId - 1}", "create")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/start/{tableId}/{wsId}")
async def startTable(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables or wsId not in tables[tableId].players:
        logger.info("Player/Table not found")

        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")

        return

    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        logger.info(message)

        if message == "start":
            if tableId in tables and tables[tableId].player_num > 1:
                print(tables[tableId].player_num)
                await ws_manager.broadcast("0", f"start/{tableId}")

            else:
                logger.info("Table not found")

                await ws_manager.broadcast("-1", f"start/{tableId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/join/{tableId}/{wsId}")
async def joinTable(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables:
        logger.info("Table not found")

        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")

        return

    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        buyIn = int(message["buyIn"])

        if wsId in tables[tableId].players:
            logger.info("Player already in table")
            ws_manager.disconnect(websocket)

            return

        tables[tableId].add_player(wsId, buyIn)

        await ws_manager.broadcast("0", f"join/{tableId}/{wsId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/nextRound/{tableId}")
async def nextRound(websocket: WebSocket, tableId: int):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        logger.info(message)

        if message == "nextRound":
            if tableId in tables:
                await ws_manager.broadcast("0", f"nextRound/{tableId}")

            else:
                logger.info("Table not found")

                await ws_manager.broadcast("-1", f"nextRound/{tableId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables or wsId not in tables[tableId].players:
        logger.info("Player/Table not found")

        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")

        return

    await ws_manager.connect(websocket)

    try:
        if tableId in tables:
            if not tables[tableId].started:
                await ws_manager.broadcast(f"Y{tables[tableId].player_order.index(wsId)}", f"betting/{tableId}/{wsId}")

            if not tables[tableId].started and tables[tableId].player_num == len(
                [x for x in ws_manager.active_connections if f"/ws/betting/{tableId}" in x.url.path]
            ):
                await tables[tableId].next_round()

                tables[tableId].started = True

        while websocket and tableId in tables and wsId in tables[tableId].players:
            message = await websocket.receive_text()
            print(message)

            message = json.loads(message)
            logger.info((tableId, message))

            if message == "N":
                await tables[tableId].next_round()

                continue

            if tableId in tables and tables[tableId].get_current_player() != wsId:
                logger.warning("Not your turn")

                continue

            await tables[tableId].action(wsId, message)

    except WebSocketDisconnect:
        if tableId in tables:
            tables[tableId].remove_player(wsId)

            if len(tables[tableId].players) < 2:
                del tables[tableId]

            else:
                await ws_manager.broadcast(f"Y{tables[tableId].player_order.index(wsId)}", f"betting/{tableId}/{wsId}")

        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
