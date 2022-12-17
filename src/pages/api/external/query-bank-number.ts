import { verify } from "./../../../lib/rsa";
import { validateSchema } from "./../../../core/catchAsync";
import path from "path";
import { z } from "zod";
import { catchAsync } from "../../../core/catchAsync";
import { ApiError } from "../../../core/baseResponse";
import { CustomerService } from "../../../lib/database/customerService";

const postDepositSchema = z.object({
  signature: z.string().min(1),
  data: z.string().min(1),
});

const ERR_10_DIGITS = "Account number must be 10 digits";

const rawDataSchema = z.object({
  accountNumber: z.string().min(10, ERR_10_DIGITS).max(10, ERR_10_DIGITS),
});

// pay
export default catchAsync(async function dangerouslyHandle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(postDepositSchema, req.body);
      // get encoded data
      const { data, signature } = postDepositSchema.parse(req.body);
      const isValid = await verify({
        data,
        signature,
        publicKeyPath: path.join(process.cwd(), "public/pubkey.pub"),
      });
      if (!isValid) {
        throw new ApiError("Invalid signature", 400);
      }

      const decoded = Buffer.from(data, "base64").toString("utf8");
      console.log(decoded);

      validateSchema(rawDataSchema, JSON.parse(decoded));
      const { accountNumber } = rawDataSchema.parse(JSON.parse(decoded));

      const result = await CustomerService.getCustomerByBankNumber(
        accountNumber
      );

      res.status(200).json({
        data: {
          message: "success",
          ...result,
        },
      });

      break;
    }
  }
});

async function test() {
  // decoded
  const rawData = Buffer.from(
    JSON.stringify({
      // must be 10 number
      accountNumber: "1234567890",
    })
  ).toString("base64");

  // await rawDataSchema.parseAsync(rawData);

  const signedData = await sign(rawData);

  const API_URL = "https://hcmus-internet-banking-backend.vercel.app";

  const res = await axios.post(`${API_URL}/api/external/query-bank-number`, {
    data: rawData,
    signature: signedData.signature,
  });

  console.table(res.data);
}
