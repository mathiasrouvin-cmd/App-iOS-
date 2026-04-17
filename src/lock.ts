function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (let i = 0; i < arr.byteLength; i++) bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str: string): ArrayBuffer {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s + pad)
  const ab = new ArrayBuffer(bin.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return ab
}

function randomBytes(n: number): ArrayBuffer {
  const ab = new ArrayBuffer(n)
  crypto.getRandomValues(new Uint8Array(ab))
  return ab
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    !!navigator.credentials
}

export async function registerCredential(): Promise<string> {
  if (!isWebAuthnSupported()) throw new Error('Face ID / Touch ID non disponible sur cet appareil.')

  const userId = randomBytes(16)
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Mon compte' },
      user: {
        id: userId,
        name: 'utilisateur',
        displayName: 'Utilisateur'
      },
      challenge: randomBytes(32),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60_000,
      attestation: 'none'
    }
  }) as PublicKeyCredential | null

  if (!cred) throw new Error('Enregistrement annulé.')
  return b64urlEncode(cred.rawId)
}

export async function verifyCredential(credentialId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{
          id: b64urlDecode(credentialId),
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60_000
      }
    })
    return !!assertion
  } catch {
    return false
  }
}
