import { ApiError } from "../../../core/baseResponse";
import { catchAsync } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";
import { CustomerService } from "../../../lib/database/customerService";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const result = await CustomerService.closeAccount(id);

      if (!result) throw new ApiError("Invalid token", 401);

      res.status(200).json({ data: result });
      break;
    }
    default: {
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
    }
  }
});
