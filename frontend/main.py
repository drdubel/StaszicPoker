from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse

app = FastAPI(debug=True)
app.add_middleware(SessionMiddleware, secret_key="!secret")
app.mount("/static", StaticFiles(directory="static", html=True), name="static")


config = Config("data/.env")
oauth = OAuth(config)

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)


@app.get("/")
async def homepage():
    return HTMLResponse('<a href="/login">login</a>')


@app.get("/lobby")
async def lobby():
    return FileResponse("static/lobby.html")


@app.get("/tableLobby/{tableId}")
async def tableLobby():
    return FileResponse("static/tableLobby.html")


@app.get("/poker/{tableId}")
async def rooms():
    with open("static/poker.html") as f:
        return HTMLResponse(f.read())


@app.get("/login")
async def login(request: Request):
    redirect_uri = "http://127.0.0.1:5000/auth"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/logout")
async def logout():
    return RedirectResponse(url="http://127.0.0.1:5000/logout")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
