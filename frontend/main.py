import os

from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request

app = FastAPI()
app.mount("/static", StaticFiles(directory="./static", html=True), name="static")


@app.get("/")
async def homepage(request: Request):
    with open(os.path.join("static", "index.html")) as fh:
        data = fh.read()

    return Response(content=data, media_type="text/html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
    # Ensure the static files directory is served
