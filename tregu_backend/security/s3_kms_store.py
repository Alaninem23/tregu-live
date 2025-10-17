# tregu_backend/security/s3_kms_store.py
import json
import uuid
from dataclasses import dataclass
from typing import Optional, Tuple

import boto3
from botocore.client import Config
from .crypto import aesgcm_encrypt, aesgcm_decrypt, b64e, b64d

@dataclass
class S3KMSConfig:
    bucket: str
    kms_key_id: str
    region: Optional[str] = None

class S3KMSEnvelopeStore:
    """
    Envelope encryption:
      - GenerateDataKey via KMS -> (Plaintext DEK, Encrypted DEK)
      - Use Plaintext DEK to AES-GCM encrypt bytes
      - Store ciphertext in S3 object: <key>.bin
      - Store sidecar JSON meta:      <key>.meta.json containing enc_DEK, nonce, content_type, filename, size
      - On read: fetch meta, KMS.Decrypt(enc_DEK) -> DEK, decrypt ciphertext
    """
    def __init__(self, cfg: S3KMSConfig):
        session = boto3.session.Session(region_name=cfg.region)
        self.s3 = session.client("s3", config=Config(s3={"addressing_style": "path"}))
        self.kms = session.client("kms")
        self.bucket = cfg.bucket
        self.kms_key_id = cfg.kms_key_id

    def store(self, data: bytes, *, filename: str, content_type: str) -> str:
        # 1) Generate a fresh data key
        gdk = self.kms.generate_data_key(KeyId=self.kms_key_id, KeySpec="AES_256")
        dek_plain = gdk["Plaintext"]            # bytes (not persisted)
        dek_encrypted = gdk["CiphertextBlob"]   # bytes (persist safely)

        # 2) Encrypt data with DEK
        nonce, ct = aesgcm_encrypt(data, dek_plain)

        # 3) Persist to S3 (binary + meta sidecar)
        file_id = str(uuid.uuid4())
        bin_key = f"enc/{file_id}.bin"
        meta_key = f"enc/{file_id}.meta.json"

        self.s3.put_object(
            Bucket=self.bucket,
            Key=bin_key,
            Body=ct,
            ContentType="application/octet-stream",
        )

        meta = {
            "enc_dek_b64": b64e(dek_encrypted),
            "nonce_b64": b64e(nonce),
            "filename": filename,
            "content_type": content_type or "application/octet-stream",
            "size": len(data),
            "version": 1,
        }
        self.s3.put_object(
            Bucket=self.bucket,
            Key=meta_key,
            Body=json.dumps(meta).encode("utf-8"),
            ContentType="application/json",
        )
        return file_id

    def fetch(self, file_id: str) -> Tuple[bytes, str, str]:
        """
        Returns (plaintext, filename, content_type).
        """
        bin_key = f"enc/{file_id}.bin"
        meta_key = f"enc/{file_id}.meta.json"

        # Get meta
        meta_obj = self.s3.get_object(Bucket=self.bucket, Key=meta_key)
        meta = json.loads(meta_obj["Body"].read().decode("utf-8"))

        # Decrypt DEK
        enc_dek = b64d(meta["enc_dek_b64"])
        dek_plain = self.kms.decrypt(CiphertextBlob=enc_dek)["Plaintext"]

        # Get ciphertext
        bin_obj = self.s3.get_object(Bucket=self.bucket, Key=bin_key)
        ct = bin_obj["Body"].read()
        nonce = b64d(meta["nonce_b64"])

        # Decrypt
        pt = aesgcm_decrypt(nonce, ct, dek_plain)

        return pt, meta.get("filename", "file"), meta.get("content_type", "application/octet-stream")
