import { ApiError } from "../../../core/baseResponse";
import { TokenService } from "../../../lib/database/tokenService";
import { CustomerService } from "../../../lib/database/customerService";
import { catchAsync } from "../../../core/catchAsync";

export default catchAsync(async function handle(req, res) {
  const { bankNumber } = req.query;

  switch (req.method) {
    case "GET":
      await TokenService.requireAuth(req);

      const result = await CustomerService.getCustomerByBankNumber(
        bankNumber as string
      );

      if (!result) {
        throw new ApiError("Customer not found", 404);
      }

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
