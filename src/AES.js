const BigInt = window.BigInt;

// Miller-Rabin primality test for BigInt
function MillerRabinTest(n, k) {
  // Handle simple cases
  if (n <= 1n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  const N = n - 1n;
  // Find s and d such that n-1 = 2^s * d, where d is odd
  let s = 0n;
  let d = N;

  while (d % 2n === 0n) {
    d = d / 2n;
    s = s + 1n;
  }

  // Witness loop - try k different random witnesses
  for (let i = 0; i < k; i++) {
    const a = randomBigInt(2n, n - 2n);
    let x = modPowBigInt(a, d, n);

    if (x === 1n || x === N) continue; // Probably prime, try next witness

    let isProbablyPrime = false;

    // Repeatedly square x, checking for n-1 at each step
    for (let j = 0n; j < s - 1n; j = j + 1n) {
      x = (x * x) % n;
      if (x === N) {
        isProbablyPrime = true;
        break; // Found a value that equals n-1, continue to next witness
      }
      if (x === 1n) return false; // Definitely composite
    }

    if (!isProbablyPrime) return false; // Failed this round, definitely composite
  }

  return true; // Passed all rounds, probably prime
}
// Modular exponentiation for BigInt
function modPowBigInt(base, exponent, modulus) {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;

  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent / 2n;
    base = (base * base) % modulus;
  }

  return result;
}
// Generate a random BigInt in range [min, max]
function randomBigInt(min, max) {
  // Calculate range size
  const range = max - min + 1n;

  // Get number of bytes needed
  const bytes = (range.toString(2).length + 7) >> 3;

  // Create random bytes
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes);

  // Convert to BigInt and map to desired range
  let randomValue = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    randomValue = (randomValue << 8n) | BigInt(randomBytes[i]);
  }

  // Ensure result is within range
  return min + (randomValue % range);
}

function generateSecureRandomBigInt(bitLength) {
  // 1. Calculate the number of bytes needed.
  const byteLength = Math.ceil(bitLength / 8);

  // 2. Create a buffer to hold the random bytes.
  const randomBytes = new Uint8Array(byteLength);

  // 3. Fill the buffer with cryptographically secure random values.
  crypto.getRandomValues(randomBytes);

  // 4. Convert the bytes to a BigInt.
  // We do this by converting the bytes to a hex string first.
  let hex = "";
  for (let i = 0; i < randomBytes.length; i++) {
    // Convert byte to a 2-digit hex string and pad with '0' if needed.
    hex += randomBytes[i].toString(16).padStart(2, "0");
  }

  // Prepend '0x' to the hex string to create the BigInt.
  return BigInt("0x" + hex);
}

function getPrime() {
  let primeCandidate = 0n;
  do {
    primeCandidate = generateSecureRandomBigInt(1024);
  } while (!MillerRabinTest(primeCandidate, 40));
  return primeCandidate;
}

function extendedGCD(a, b) {
  if (a === 0n) return [b, 0n, 1n];
  const [gcd, x1, y1] = extendedGCD(b % a, a);
  const x = y1 - (b / a) * x1;
  const y = x1;
  return [gcd, x, y];
}

// Function to calculate the least common multiple (LCM) of two BigInts
function lcm(a, b) {
  return (a * b) / extendedGCD(a, b)[0];
}

export function RSA() {
  let p = getPrime();
  let q = getPrime();
  while (p === q) {
    q = getPrime();
  }
  let n = p * q;
  let phi = lcm(p - 1n, q - 1n);
  const e = 65537n; // Common choice for e, must be coprime with phi
  const [gcd, d] = extendedGCD(e, phi);
  const d_positive = ((d % phi) + phi) % phi; // Ensure d is positive
  return {
    n,
    e,
    d: d_positive,
  };
}

export async function GetAESKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  return { key };
}

export async function AESEncrypt(plainText, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV

  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  return {
    encrypted: new Uint8Array(encrypted),
    iv,
  };
}

export async function AESDecrypt(encrypted, key, iv) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encrypted
  );
  const decoder = new TextDecoder();
  return {
    decrypted: decoder.decode(decrypted),
  };
}

export function uint8ArrayToBase64(uint8Array) {
//   const base64chars =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
//   let result = "";
//   let i = 0;

//   while (i < uint8Array.length) {
//     const byte1 = uint8Array[i++];
//     const byte2 = i < uint8Array.length ? uint8Array[i++] : 0;
//     const byte3 = i < uint8Array.length ? uint8Array[i++] : 0;

//     const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;

//     result += base64chars.charAt((bitmap >> 18) & 63);
//     result += base64chars.charAt((bitmap >> 12) & 63);
//     result +=
//       i - 2 < uint8Array.length ? base64chars.charAt((bitmap >> 6) & 63) : "=";
//     result += i - 1 < uint8Array.length ? base64chars.charAt(bitmap & 63) : "=";
//   }

//   return result;
  return btoa(String.fromCharCode(...uint8Array));
}

export function base64ToUint8Array(base64String) {
  //   const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  //   const charMap = new Map();
  //   for (let i = 0; i < base64chars.length; i++) {
  //     charMap.set(base64chars[i], i);
  //   }

  //   // Remove padding
  //   const cleanBase64 = base64String.replace(/=/g, '');
  //   const bytes = [];

  //   for (let i = 0; i < cleanBase64.length; i += 4) {
  //     const char1 = charMap.get(cleanBase64[i]) || 0;
  //     const char2 = charMap.get(cleanBase64[i + 1]) || 0;
  //     const char3 = charMap.get(cleanBase64[i + 2]) || 0;
  //     const char4 = charMap.get(cleanBase64[i + 3]) || 0;

  //     const bitmap = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;

  //     bytes.push((bitmap >> 16) & 255);
  //     if (i + 2 < cleanBase64.length) bytes.push((bitmap >> 8) & 255);
  //     if (i + 3 < cleanBase64.length) bytes.push(bitmap & 255);
  //   }

  //   return new Uint8Array(bytes);
  return new Uint8Array(
    atob(base64String)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
}

export function RSAEncrypt(message, publicKey) {
  const { n, e } = publicKey;

  // Convert message to BigInt
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  // Convert bytes to BigInt
  let messageBigInt = 0n;
  for (let i = 0; i < messageBytes.length; i++) {
    messageBigInt = (messageBigInt << 8n) | BigInt(messageBytes[i]);
  }

  // Ensure message is smaller than n
  if (messageBigInt >= n) {
    throw new Error("Message too large for RSA key size");
  }

  // Encrypt: c = m^e mod n
  const encrypted = modPowBigInt(messageBigInt, e, n);
  return encrypted;
}

export function RSADecrypt(ciphertext, privateKey) {
  const { n, d } = privateKey;

  // Decrypt: m = c^d mod n
  const decrypted = modPowBigInt(ciphertext, d, n);

  // Convert BigInt back to string
  const bytes = [];
  let temp = decrypted;

  while (temp > 0n) {
    bytes.unshift(Number(temp & 0xffn));
    temp = temp >> 8n;
  }

  // Filter out leading null bytes and control characters
  const cleanBytes = bytes.filter((byte, index) => {
    // Remove leading bytes that are 0 or control characters (1-31)
    if (index === 0 && byte <= 31) {
      return false;
    }
    return true;
  });

  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(cleanBytes));
}

export async function ExportAESKey(key) {
  const exported = await crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(exported));
}

export async function ImportAESKey(keyBase64) {
  // Convert Base64 string back to Uint8Array
  const keyBytes = base64ToUint8Array(keyBase64);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

export function uint8ArrayToBigInt(uint8Array) {
  let result = 0n;
  for (let i = 0; i < uint8Array.length; i++) {
    result = (result << 8n) | BigInt(uint8Array[i]);
  }
  return result;
}

export function bigIntToUint8Array(bigInt) {
  const bytes = [];
  let temp = bigInt;

  if (temp === 0n) {
    return new Uint8Array([0]);
  }

  while (temp > 0n) {
    bytes.unshift(Number(temp & 0xffn));
    temp = temp >> 8n;
  }

  return new Uint8Array(bytes);
}

export function bigintToBase64(bigintValue) {
  // Convert BigInt to byte array
  const byteArray = [];
  let temp = bigintValue;
  while (temp > 0n) {
    byteArray.unshift(Number(temp & 0xffn)); // Get the last byte
    temp = temp >> 8n; // Shift right by 8 bits
  }
  // Convert byte array to Uint8Array
  const uint8Array = new Uint8Array(byteArray);
  return uint8ArrayToBase64(uint8Array);
}

export function base64ToBigint(base64String) {
  // Convert Base64 string to Uint8Array
  const uint8Array = base64ToUint8Array(base64String);
  // Convert Uint8Array to BigInt (big-endian)
  let bigintValue = 0n;
  for (const byte of uint8Array) {
    bigintValue = (bigintValue << 8n) | BigInt(byte);
  }
  return bigintValue;
}
