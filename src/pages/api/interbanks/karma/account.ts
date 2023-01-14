import { ApiError } from "../../../../core/baseResponse";
import { catchAsync } from "../../../../core/catchAsync";
import { TokenService } from "../../../../lib/database/tokenService";
import { getKarmaAccountInfoBySoTK } from "../../../../lib/karma";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);
      const { accountNumber } = req.query;
      if (!accountNumber) {
        throw new ApiError("Invalid request", 400);
      }
      const result = await getKarmaAccountInfoBySoTK({
        soTK: accountNumber as string,
        tenNH: "HCMUSBank",
      });
      const { chuKy, ...data } = result.data;

      res.status(200).json({ data: data });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
