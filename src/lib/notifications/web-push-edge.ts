/**
 * Edge-Compatible Web Push Client (RFC 8291 + RFC 8292)
 *
 * Runs natively on Cloudflare Workers / Cloudflare Pages Edge Runtime and Node 18+.
 * Uses standard WebCrypto (crypto.subtle) without any Node.js crypto dependencies.
 */

import { urlBase64ToUint8Array } from "./vapid";

export interface SendPushOptions {
  vapidSubject: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  ttl?: number; // Time-to-live in seconds (default: 86400)
  urgency?: "very-low" | "low" | "normal" | "high";
}

export interface PushResult {
  success: boolean;
  statusCode: number;
  expired: boolean; // 404 or 410
  error?: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

/**
 * Generates an RFC 8292 VAPID Authorization header using WebCrypto ECDSA P-256.
 */
export async function createVapidAuthHeader(
  endpointUrl: string,
  subject: string,
  publicKeyBase64Url: string,
  privateKeyBase64Url: string,
  expirationSeconds = 12 * 3600
): Promise<string> {
  const parsed = new URL(endpointUrl);
  const audience = `${parsed.protocol}//${parsed.host}`;

  const pubBytes = urlBase64ToUint8Array(publicKeyBase64Url);
  if (pubBytes.length !== 65 || pubBytes[0] !== 4) {
    throw new Error("Invalid uncompressed P-256 public key for VAPID");
  }

  const x = base64UrlEncode(pubBytes.slice(1, 33));
  const y = base64UrlEncode(pubBytes.slice(33, 65));
  const d = privateKeyBase64Url;

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + expirationSeconds,
    sub: subject,
  };

  const enc = new TextEncoder();
  const tokenPart1 = `${base64UrlEncode(enc.encode(JSON.stringify(header)))}.${base64UrlEncode(enc.encode(JSON.stringify(payload)))}`;
  const sigBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    enc.encode(tokenPart1) as unknown as BufferSource
  );

  const sigBase64Url = base64UrlEncode(new Uint8Array(sigBuffer));
  const jwt = `${tokenPart1}.${sigBase64Url}`;
  return `vapid t=${jwt}, k=${publicKeyBase64Url}`;
}

/**
 * Encrypts a message payload according to RFC 8291 (aes128gcm) using WebCrypto.
 */
export async function encryptWebPushPayload(
  payloadText: string,
  userP256dhBase64Url: string,
  userAuthBase64Url: string
): Promise<Uint8Array> {
  const userPubKeyBytes = urlBase64ToUint8Array(userP256dhBase64Url);
  const userAuthBytes = urlBase64ToUint8Array(userAuthBase64Url);

  // 1. Generate local ephemeral ECDH keypair
  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const senderPubBuffer = await crypto.subtle.exportKey("raw", senderKeyPair.publicKey);
  const senderPubBytes = new Uint8Array(senderPubBuffer);

  // 2. Import subscriber public key
  const userKey = await crypto.subtle.importKey(
    "raw",
    userPubKeyBytes as unknown as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 3. Compute ECDH shared secret
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: "ECDH", public: userKey },
    senderKeyPair.privateKey,
    256
  );
  const sharedSecretBytes = new Uint8Array(sharedSecretBuffer);

  // 4. Derive IKM via HKDF
  // authInfo = "WebPush: info\0" || userPubKey || senderPubKey
  const enc = new TextEncoder();
  const authInfo = concatBuffers(
    enc.encode("WebPush: info\0"),
    userPubKeyBytes,
    senderPubBytes
  );

  const hkdfKey1 = await crypto.subtle.importKey(
    "raw",
    sharedSecretBytes as unknown as BufferSource,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const ikmBuffer = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: userAuthBytes as unknown as BufferSource,
      info: authInfo as unknown as BufferSource,
    },
    hkdfKey1,
    256
  );
  const ikmBytes = new Uint8Array(ikmBuffer);

  // 5. Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 6. Derive CEK (Content Encryption Key) and Nonce from IKM and salt
  const hkdfKey2 = await crypto.subtle.importKey(
    "raw",
    ikmBytes as unknown as BufferSource,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const cekInfo = enc.encode("Content-Encoding: aes128gcm\0");
  const cekBuffer = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      info: cekInfo as unknown as BufferSource,
    },
    hkdfKey2,
    128 // 16 bytes
  );

  const nonceInfo = enc.encode("Content-Encoding: nonce\0");
  const nonceBuffer = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      info: nonceInfo as unknown as BufferSource,
    },
    hkdfKey2,
    96 // 12 bytes
  );

  // 7. Plaintext record padding (RFC 8291 section 4)
  const payloadBytes = enc.encode(payloadText);
  const padded = new Uint8Array(payloadBytes.length + 1);
  padded.set(payloadBytes, 0);
  padded[payloadBytes.length] = 2; // 0x02 delimiter for final record

  // 8. Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cekBuffer as unknown as BufferSource,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(nonceBuffer) as unknown as BufferSource,
      tagLength: 128,
    },
    aesKey,
    padded as unknown as BufferSource
  );

  // 9. Build RFC 8291 aes128gcm header (86 bytes total):
  // salt (16 bytes) || rs (4 bytes uint32 BE) || idlen (1 byte = 65) || keyid (65 bytes senderPubBytes)
  const header = new Uint8Array(86);
  header.set(salt, 0);
  const view = new DataView(header.buffer);
  view.setUint32(16, 4096, false); // big-endian rs = 4096
  header[20] = 65; // idlen
  header.set(senderPubBytes, 21);

  return concatBuffers(header, new Uint8Array(ciphertextBuffer));
}

/**
 * Sends a Web Push notification to an endpoint with bounded retries for 429/5xx.
 */
export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payloadText: string,
  options: SendPushOptions
): Promise<PushResult> {
  const {
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey,
    ttl = 86400,
    urgency = "high",
  } = options;

  let body: Uint8Array | null = null;
  if (payloadText && payloadText.length > 0) {
    body = await encryptWebPushPayload(
      payloadText,
      subscription.keys.p256dh,
      subscription.keys.auth
    );
  }

  const vapidAuth = await createVapidAuthHeader(
    subscription.endpoint,
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  const headers: Record<string, string> = {
    Authorization: vapidAuth,
    TTL: String(ttl),
    Urgency: urgency,
  };

  if (body) {
    headers["Content-Type"] = "application/octet-stream";
    headers["Content-Encoding"] = "aes128gcm";
  } else {
    headers["Content-Length"] = "0";
  }

  // Bounded retry with exponential backoff: max 2 retries (3 attempts total)
  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt++;
    try {
      const res = await fetch(subscription.endpoint, {
        method: "POST",
        headers,
        body: body ? (body as unknown as BodyInit) : undefined,
      });

      if (res.status === 200 || res.status === 201) {
        return { success: true, statusCode: res.status, expired: false };
      }

      // 404 Not Found or 410 Gone indicates expired or revoked subscription
      if (res.status === 404 || res.status === 410) {
        return {
          success: false,
          statusCode: res.status,
          expired: true,
          error: `Subscription expired or removed (${res.status})`,
        };
      }

      // 429 or 5xx: Transient error, retry if attempts remain
      if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
        const retryAfterHeader = res.headers.get("retry-after");
        let delayMs = 500 * Math.pow(2, attempt - 1); // 500ms, 1000ms
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
            delayMs = Math.min(parsedSeconds * 1000, 2000); // capped at 2s
          }
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Other non-retriable errors
      const errorText = await res.text().catch(() => "");
      return {
        success: false,
        statusCode: res.status,
        expired: false,
        error: `Push service rejected notification: HTTP ${res.status} ${errorText.slice(0, 100)}`,
      };
    } catch (fetchErr: any) {
      if (attempt <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return {
        success: false,
        statusCode: 0,
        expired: false,
        error: fetchErr?.message || "Network error sending push",
      };
    }
  }

  return {
    success: false,
    statusCode: 0,
    expired: false,
    error: "Exceeded maximum retry attempts",
  };
}
