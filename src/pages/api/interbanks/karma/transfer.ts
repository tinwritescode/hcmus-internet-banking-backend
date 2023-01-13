import { TransactionService } from "../../../../lib/database/transactionService";
import { z } from "zod";
import { ApiError } from "../../../../core/baseResponse";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { CustomerService } from "../../../../lib/database/customerService";
import { TokenService } from "../../../../lib/database/tokenService";
import { postKarmaTransfer } from "../../../../lib/karma";

const externalTransferSchema = z.object({
  amount: z.preprocess(BigInt, z.bigint()).refine((amount) => amount > 0),
  to: z.string(),
  message: z.string().optional(),
  token: z.string(),
  payer: z.enum(["sender", "receiver"]),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(externalTransferSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const data = externalTransferSchema.safeParse(req.body);

      if (!data.success) {
        throw new ApiError("Invalid request", 400);
      }

      const { amount, to, message, token, payer } = data.data;

      await TransactionService.verifyTransactionToken(token);

      const fromCustomer = await CustomerService.getCustomerById(id, {
        withBalance: false,
        withEmail: false,
      });

      const isTrans = await postKarmaTransfer({
        soTien: amount as any,
        noiDungCK: message,
        nguoiNhan: to,
        nguoiChuyen: fromCustomer.accountNumber,
        loaiCK: "sender",
        tenNH: "HCMUSBank",
      });

      if (!isTrans) {
        await CustomerService.transferInternally({
          from: fromCustomer.accountNumber,
          to: to,
          amount,
          message,
          payer,
        });
      }
      res.status(200).json({ data: isTrans });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
