import { GetAESKey, RSA, ExportAESKey, RSAEncrypt, bigintToBase64, base64ToBigint, RSADecrypt, ImportAESKey, AESEncrypt, uint8ArrayToBase64, AESDecrypt, base64ToUint8Array } from "./AES.js";

function InitializeParties(){
  const RSA_1 = RSA();
  const RSA_2 = RSA();
  const sender = {
    public_key: [RSA_1.n, RSA_1.e],
    private_key: [RSA_1.n, RSA_1.d],
  };

  const receiver = {
    public_key: [RSA_2.n, RSA_2.e],
    private_key: [RSA_2.n, RSA_2.d],
  };
  return { sender, receiver };
}

export async function InitializeSessionSender(receiver) {
  const AESKey = await GetAESKey();
  const base64_aes_key = await ExportAESKey(AESKey.key);
  const receiverPublicKey = receiver.public_key;
  const encryptedAESKey = RSAEncrypt(base64_aes_key, {
    n: receiverPublicKey[0],
    e: receiverPublicKey[1]
  })
  const base64_encryptedAESKey = bigintToBase64(encryptedAESKey);
  return [base64_encryptedAESKey, AESKey.key]
}

export async function InitializeSessionReceiver(base64_encryptedAESKey, self) {
  const encryptedAESKey = base64ToBigint(base64_encryptedAESKey);
  const private_key = self.private_key;
  const decryptedAESKey = RSADecrypt(encryptedAESKey, {
    n: private_key[0],  
    d: private_key[1]
  })
  return decryptedAESKey
}

export async function main() {
  const { sender, receiver } = InitializeParties();

  console.log("STARTING SESSION");
  const [base64_encryptedAESKey, aes_key] = await InitializeSessionSender(receiver);
  sender.aes_key = aes_key;
  const decryptedAESKey = await InitializeSessionReceiver(base64_encryptedAESKey, receiver);
  receiver.aes_key = await ImportAESKey(decryptedAESKey)
  const { encrypted, iv } = await AESEncrypt("My name is Allision Burgers.", sender.aes_key)

  const base64_msg = uint8ArrayToBase64(encrypted)
  console.log("SENT base64 = ", base64_msg)
  const base64_iv = uint8ArrayToBase64(iv)
  
  
  const msg_arr = base64ToUint8Array(base64_msg);
  
  console.log(uint8ArrayToBase64(msg_arr))

  const msg_iv = base64ToUint8Array(base64_iv)
  const { decrypted } = await AESDecrypt(msg_arr, receiver.aes_key, msg_iv)
  console.log("RECEIVED MSG = ", decrypted)

}
