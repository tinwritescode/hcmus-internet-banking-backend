export const decrypt = async (key: CryptoKey, data: ArrayBuffer) => {
  return await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    data
  );
};

export const encrypt = async (key: CryptoKey, data: ArrayBuffer) => {
  return await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    data
  );
};
