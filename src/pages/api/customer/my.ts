import { TokenService } from "./../../../server/database/tokenService";
import { CustomerService } from "../../../server/database/customerService";
import { catchAsync } from "../../../base/catchAsync";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET":
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const result = await CustomerService.getCustomerById(id, {
        withBalance: true,
      });

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
