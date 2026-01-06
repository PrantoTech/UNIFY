from fastapi import FastAPI
import uvicorn

app = FastAPI(title="UNIFY Test")

@app.get("/")
async def root():
    return {"message": "UNIFY Smart Campus Platform API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
