import { TransactionService } from "./../../../server/database/transactionService";
import { z } from "zod";
import { ApiError } from "../../../base/baseResponse";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { TokenService } from "../../../server/database/tokenService";

const internalTransferSchema = z.object({
  amount: z.preprocess(BigInt, z.bigint()).refine((amount) => amount > 0),
  to: z.string(),
  message: z.string().optional(),
  token: z.string(),
  payer: z.enum(["sender", "receiver"]),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(internalTransferSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const data = internalTransferSchema.safeParse(req.body);

      if (!data.success) {
        throw new ApiError("Invalid request", 400);
      }

      const { amount, to, message, token, payer } = data.data;

      await TransactionService.verifyTransactionToken(token);

      const receiverId = await CustomerService.getCustomerIdByBankNumber(to);

      if (!receiverId) {
        throw new ApiError("Invalid bank number", 400);
      }

      const result = await CustomerService.transferInternally({
        from: id,
        to: receiverId,
        amount,
        message,
        payer,
      });

      res.status(200).json({ data: result });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
