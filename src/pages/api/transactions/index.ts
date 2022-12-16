import { TransactionService } from "../../../lib/database/transactionService";
import { catchAsync } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { offset, limit } = req.query;
      const recipients = await TransactionService.getTransactionsByCustomerId(
        id,
        parseInt((offset as string) || "0"),
        parseInt((limit as string) || "10")
      );

      res.status(200).json({ data: recipients });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
