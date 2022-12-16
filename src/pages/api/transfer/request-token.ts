import { CustomerService } from "../../../lib/database/customerService";
import { TransactionService } from "../../../lib/database/transactionService";
import { catchAsync } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      await TransactionService.generateTransactionToken(id);
      const userEmail = (await CustomerService.getCustomerById(id, {})).email;

      res.status(200).json({
        data: {
          message: `A token has been sent to ${userEmail}`,
        },
      });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
