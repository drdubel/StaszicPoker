from pickle import dump, load
from secrets import token_urlsafe
from typing import Optional

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import FastAPI, Cookie
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="!secret")
app.mount("/static", StaticFiles(directory="./static", html=True), name="static")


config = Config("data/.env")
oauth = OAuth(config)

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)


with open("data/cookies.pickle", "rb") as cookies:
    access_cookies: dict = load(cookies)


@app.get("/")
async def homepage(request: Request, access_token: Optional[str] = Cookie(None)):
    user = request.session.get("user")

    if access_token in access_cookies:
        return RedirectResponse(url="/lobby")

    if user:
        return HTMLResponse('<h1>Sio!</h1><a href="/login">login</a>')

    return HTMLResponse('<a href="/login">login</a>')


@app.get("/lobby")
async def lobby(request: Request, access_token: Optional[str] = Cookie(None)):
    user = request.session.get("user")

    if user and access_token in access_cookies:
        return FileResponse("static/lobby.html")

    return RedirectResponse(url="/")


@app.get("/poker")
async def rooms(request: Request):
    return FileResponse("static/poker.html")


@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth")
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
        access_token = token_urlsafe()
        access_cookies[access_token] = user["email"]

        with open("data/cookies.pickle", "wb") as cookies:
            dump(access_cookies, cookies)

        response = RedirectResponse(url="/lobby")
        response.set_cookie("access_token", access_token, max_age=3600 * 24 * 14)
        return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
