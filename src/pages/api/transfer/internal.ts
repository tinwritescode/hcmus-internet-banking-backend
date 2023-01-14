import { RecipientService } from "./../../../lib/database/recipientService";
import { TransactionService } from "../../../lib/database/transactionService";
import { z } from "zod";
import { ApiError } from "../../../core/baseResponse";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { CustomerService } from "../../../lib/database/customerService";
import { TokenService } from "../../../lib/database/tokenService";

const internalTransferSchema = z.object({
  amount: z.preprocess(BigInt, z.bigint()).refine((amount) => amount > 0),
  to: z.string(),
  message: z.string().optional(),
  token: z.string(),
  payer: z.enum(["sender", "receiver"]),
  saveInfo: z.coerce.boolean().default(false),
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

      const { amount, to, message, token, payer, saveInfo } = data.data;

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

      if (saveInfo) {
        await RecipientService.createRecipient({
          accountNumber: to,
          internalBankCustomer: {
            connect: {
              id,
            },
          },
          customerRecipient: {
            connectOrCreate: {
              where: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                customerId_recipientId: {
                  customerId: id,
                  recipientId: to,
                },
              },
              create: {
                customerId: id,
              },
            },
          },
        }).catch(() => {
          // ignore already exists error
        });

        console.log("result", result);
      }

      res.status(200).json({ data: result });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
