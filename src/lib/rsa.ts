import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export const createPair = async () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
  });

  // console.log({ publicKey: publicKey.export({ type: "spki", format: "pem" }) });

  await fs.writeFile(
    path.join(process.cwd(), "public/pubkey.pub"),
    publicKey.export({ type: "spki", format: "pem" })
  );

  await fs.writeFile(
    path.join(process.cwd(), "public/privkey.pem"),
    privateKey.export({ type: "pkcs8", format: "pem" })
  );
};

export const sign = async (data: string) => {
  const privateKey = await fs.readFile(
    path.join(process.cwd(), "public/privkey.pem"),
    "utf8"
  );

  const sign = crypto.createSign("RSA-SHA256");

  sign.update(data);
  sign.end();

  const signature = sign.sign(privateKey, "base64");

  return signature;
};

// return true if signature is valid
export const verify = async ({
  data,
  signature,
  publicKeyPath = path.join(process.cwd(), "public/pubkey.pub"),
}: {
  data: string;
  signature: string;
  publicKeyPath?: string;
}) => {
  const publicKey = await fs.readFile(publicKeyPath, "utf8");
  const verify = crypto.createVerify("RSA-SHA256");

  verify.update(data);
  verify.end();

  const verified = verify.verify(publicKey, signature, "base64");

  return verified;
};

// async function main() {
//   // decoded
//   const rawData = {
//     message: "Xin chao cac ban lai la chao day",
//   };
//   const signedData = await sign(
//     Buffer.from(JSON.stringify(rawData)).toString("base64")
//   );
//   console.table({
//     rawData: Buffer.from(JSON.stringify(rawData)).toString("base64"),
//     signedData,
//   });
// }
