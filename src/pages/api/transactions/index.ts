import { TransactionService } from "../../../lib/database/transactionService";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";
import { z } from "zod";

const querySchema = z.object({
  offset: z.coerce.number().default(0),
  limit: z.coerce.number().default(10),
  type: z.enum(["sent", "received", "all"]).default("all"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { offset, limit, type, startDate, endDate } = validateSchema(
        querySchema,
        req.query
      );
      const recipients = await TransactionService.getTransactionsByCustomerId({
        customerId: id,
        type,
        offset,
        limit,
        startDate,
        endDate,
      });

      res.status(200).json({ data: recipients });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
