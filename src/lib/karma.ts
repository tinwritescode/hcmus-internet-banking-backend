import axios, { AxiosInstance, isAxiosError } from "axios";
import crypto from "crypto";
import fs from "fs/promises";
import { TransactionService } from "./database/transactionService";

const clientKarma: AxiosInstance = axios.create({
  baseURL: process.env.KARMABANK_URL,
});

export const getKarmaAccountInfoBySoTK = async (data: any) => {
  const timestamp = new Date().toISOString();
  const privateKey = await fs.readFile("public/karma.private.key");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(JSON.stringify({ ...data, ngayTao: timestamp }));
  sign.end();
  const signature = sign.sign(privateKey, "base64");
  const payload = {
    ...data,
    ngayTao: timestamp,
    chuKy: signature,
  };
  try {
    const res = await clientKarma.post("/interbank/api/account", payload);
    const { chuKy, ...data } = res.data;
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(JSON.stringify(data));
    verify.end();
    const publicKey = await fs.readFile("public/karma.public.pem");
    const verified = verify.verify(publicKey, chuKy, "base64");
    if (!verified) {
      throw new Error("Signature is not verified");
    }

    return res;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("error", error.response?.data);
    }
  }
};

export const postKarmaTransfer = async (data: {
  soTien: number;
  noiDungCK: string;
  nguoiNhan: string;
  nguoiChuyen: string;
  loaiCK: string;
  tenNH: string;
}) => {
  const timestamp = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
  ).toISOString();

  const privateKey = await fs.readFile("public/karma.private.key");
  const sign = crypto.createSign("RSA-SHA256");

  sign.update(JSON.stringify({ ...data, ngayTao: timestamp }));

  sign.end();
  const signature = sign.sign(privateKey, "base64");
  const payload = {
    ...data,
    ngayTao: timestamp,
    chuKy: signature,
  };
  try {
    const res = await clientKarma.post("/interbank/api/transfer", payload);
    const { chuKy, ...data } = res.data;
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(JSON.stringify(data));
    verify.end();
    const publicKey = await fs.readFile("public/karma.public.pem");
    const verified = verify.verify(publicKey, chuKy, "base64");
    if (!verified) {
      throw new Error("Signature is not verified");
    }

    return res;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("error", error.response?.data);
    }
  }
};
