import json
import logging
from base64 import urlsafe_b64encode
from pickle import dump, load
from secrets import token_urlsafe
from typing import Optional

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import Cookie, FastAPI, Response, WebSocket, WebSocketDisconnect
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse

from backend.gameLogic import Table
from backend.websocket import ws_manager

logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="!secret")
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


@app.get("/auth")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        return HTMLResponse(f"<h1>{error.error}</h1>")
    user = token.get("userinfo")

    if user:
        request.session["user"] = dict(user)

        wsId = urlsafe_b64encode(user["email"].encode()).decode()
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


@app.websocket("/ws/join/{tableId}/{wsId}")
async def joinTable(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        buyIn = int(message["buyIn"])

        try:
            tables[tableId].add_player(wsId, buyIn)

            await ws_manager.broadcast("0", "join")

        except KeyError:
            print("Table not found")

            await ws_manager.broadcast("-1", "join")

    except WebSocketDisconnect:
        print("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/create/{wsId}")
async def createTable(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        tables[Table.tableId - 1] = Table(message["minBet"])

        await ws_manager.broadcast("created", "create")

    except WebSocketDisconnect:
        print("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/start/{tableId}")
async def startTable(websocket: WebSocket, tableId: int):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        print(message)

        if message == "start":
            if tableId in tables and tables[tableId].player_num > 1:
                await ws_manager.broadcast("0", "start")

            else:
                print("Table not found")

                await ws_manager.broadcast("-1", "start")

    except WebSocketDisconnect:
        print("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: int, wsId: str):
    await ws_manager.connect(websocket)

    try:
        if tableId in tables:
            if not tables[tableId].started:
                await ws_manager.broadcast(f"Y{tables[tableId].player_order.index(wsId)}", f"betting/{tableId}/{wsId}")

            if not tables[tableId].started and tables[tableId].player_num == len(
                [x for x in ws_manager.active_connections if f"/ws/betting/{tableId}" in x.url.path]
            ):
                await tables[tableId].new_round()

                tables[tableId].started = True

        while websocket:
            message = await websocket.receive_text()
            print(tables[tableId].get_current_player(), wsId)

            if tableId in tables and tables[tableId].get_current_player() != wsId:
                print("Not your turn")

                continue

            message = json.loads(message)
            print(tableId, message)

            await tables[tableId].action(wsId, message)

            if message > 0:
                print("Bet:", message)

            else:
                if message == 0:
                    print("Check")
                else:
                    print("Fold")

    except WebSocketDisconnect:
        print("Player disconnected")

        ws_manager.disconnect(websocket)
