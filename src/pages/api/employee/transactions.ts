import { TransactionService } from "./../../../lib/database/transactionService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";

const castToDate = z.coerce.date();
const castToNumber = z.coerce.number();

const putEmployeeSchema = z.object({
  // if bankId is not provided, it will get all EXTERNAL transactions
  bankId: z.string().optional(),
  //
  startDate: castToDate.optional(),
  endDate: castToDate.optional(),

  limit: castToNumber.optional(),
  offset: castToNumber.optional(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      // update employee
      await TokenService.requireEmployeeAuth(req, {
        requireAdmin: true,
      });

      const { bankId, endDate, startDate, limit, offset } = validateSchema(
        putEmployeeSchema,
        req.query
      );

      const result = await TransactionService.getTransaction({
        where: {
          extBankId: bankId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        limit: limit as number,
        offset: offset as number,
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
