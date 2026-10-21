"""ASGI application; launch from backend with uvicorn run:application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import WORKSPACES, allowed_origins, provider_configured
from app.database.store import initialize
from app.routes import auth, workspaces

@asynccontextmanager
async def lifespan(application):
    initialize()
    yield

application = FastAPI(title='AgriBovix AI', version='1.0.0', lifespan=lifespan)
application.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins()),
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type'],
)

@application.middleware('http')
async def security_headers(request: Request, call_next):
    if request.method in {'POST','PUT','PATCH','DELETE'}:
        origin = request.headers.get('origin')
        if origin and origin not in allowed_origins():
            return JSONResponse(status_code=403,content={'detail':{'code':'origin_rejected','message':'This request origin is not allowed.'}})
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['Cache-Control'] = 'no-store'
    return response

@application.exception_handler(RequestValidationError)
async def validation_error(request, error):
    # Never echo request values (including passwords) in validation responses.
    return JSONResponse(status_code=422,content={'detail':{'code':'validation_error','message':'Check the required fields and their lengths, then try again.'}})

@application.exception_handler(Exception)
async def server_error(request, error):
    return JSONResponse(status_code=500,content={'detail':{'code':'server_error','message':'The server could not complete this request. Please try again.'}})

@application.get('/api/health')
def health():
    return {'status':'ok','workspaces':{w:{'analysis_configured':provider_configured(w),'assistant_configured':provider_configured(w,'ASSISTANT')} for w in WORKSPACES}}

application.include_router(auth.router)
application.include_router(workspaces.router)
