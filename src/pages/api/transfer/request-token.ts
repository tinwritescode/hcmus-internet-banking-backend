import { TransactionService } from "./../../../server/database/transactionService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { TokenService } from "../../../server/database/tokenService";

const internalTransferSchema = z.object({
  transactionId: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(internalTransferSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const result = await TransactionService.generateTransactionToken(id);

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
