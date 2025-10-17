# tregu_backend/security/crypto.py
import base64
import secrets
from typing import Dict, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

NONCE_LEN = 12  # AES-GCM recommended

def aesgcm_encrypt(plaintext: bytes, key: bytes) -> Tuple[bytes, bytes]:
    """
    Encrypts plaintext with AES-GCM.
    Returns (nonce, ciphertext). Ciphertext includes the auth tag.
    """
    nonce = secrets.token_bytes(NONCE_LEN)
    ct = AESGCM(key).encrypt(nonce, plaintext, None)
    return nonce, ct

def aesgcm_decrypt(nonce: bytes, ciphertext: bytes, key: bytes) -> bytes:
    """
    Decrypts AES-GCM ciphertext+tag with nonce & key.
    """
    return AESGCM(key).decrypt(nonce, ciphertext, None)

def b64e(b: bytes) -> str:
    return base64.b64encode(b).decode("utf-8")

def b64d(s: str) -> bytes:
    return base64.b64decode(s)
