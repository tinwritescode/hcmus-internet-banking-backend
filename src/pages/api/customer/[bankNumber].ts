import { TokenService } from "./../../../server/database/tokenService";
import { CustomerService } from "../../../server/database/customerService";
import { catchAsync } from "../../../base/catchAsync";

export default catchAsync(async function handle(req, res) {
  const { bankNumber } = req.query;

  switch (req.method) {
    case "GET":
      await TokenService.requireAuth(req);

      const result = await CustomerService.getCustomerByBankNumber(
        bankNumber as string
      );

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
