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

const rawDataSchema = z
  .object({
    amount: z.number().min(1),
    toAccountNumber: z.string().min(1),
    message: z.string().min(1),
    fromAccountNumber: z.string().min(1),
    payer: z.enum(["receiver"]).nullable().optional().default(null),
    expiredAt: z.coerce.date(),
  })
  .refine((data) => {
    if (data.expiredAt < new Date()) {
      throw new ApiError("Expired", 400);
    }
    return true;
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
      validateSchema(rawDataSchema, JSON.parse(decoded));
      const { amount, toAccountNumber, message, fromAccountNumber, payer } =
        validateSchema(rawDataSchema, JSON.parse(decoded));

      console.log(amount, toAccountNumber, message, fromAccountNumber, payer);

      const result = await CustomerService.dangerouslyReceiveMoney({
        amount: BigInt(amount),
        from: fromAccountNumber,
        to: toAccountNumber,
        message,
        payer,
      });

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
