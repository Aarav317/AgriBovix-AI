import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / '.env')

def database_path():
    path = Path(os.getenv('DATABASE_PATH', 'backend/data/agribovix.db'))
    return path if path.is_absolute() else ROOT / path

def provider_config(workspace, kind='MODEL'):
    prefix = workspace.upper()
    return os.getenv(f'{prefix}_{kind}_URL', '').strip(), os.getenv(f'{prefix}_{kind}_KEY', '')

def provider_name(workspace, kind='MODEL'):
    return os.getenv(f'{workspace.upper()}_{kind}_PROVIDER', os.getenv('AI_PROVIDER', 'adapter')).strip().lower()

def provider_configured(workspace, kind='MODEL'):
    if provider_name(workspace, kind) == 'gemini':
        return bool(os.getenv('GEMINI_API_KEY', '').strip())
    if provider_name(workspace, kind) == 'openai':
        return bool(os.getenv('OPENAI_API_KEY', '').strip())
    return bool(provider_config(workspace, kind)[0])

def openai_model(workspace):
    return os.getenv(f'{workspace.upper()}_OPENAI_MODEL', os.getenv('OPENAI_MODEL', 'gpt-5.4-mini')).strip()

def gemini_model(workspace):
    return os.getenv(f'{workspace.upper()}_GEMINI_MODEL', os.getenv('GEMINI_MODEL', 'gemini-3.5-flash-lite')).strip()

def allowed_origins():
    configured = os.getenv('FRONTEND_ORIGIN', 'http://127.0.0.1:3000')
    return {origin.strip().rstrip('/') for origin in configured.split(',') if origin.strip()} | {
        'http://localhost:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'
    }

def cookie_same_site():
    value = os.getenv('COOKIE_SAMESITE', 'lax').strip().lower()
    return value if value in {'lax', 'strict', 'none'} else 'lax'

WORKSPACES = ('agrivision', 'pashuvision')
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
