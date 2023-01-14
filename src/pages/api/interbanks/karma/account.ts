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

      try {
        const result = await getKarmaAccountInfoBySoTK({
          soTK: accountNumber as string,
          tenNH: "HCMUSBank",
        });

        if (result) {
          const { chuKy, ...ret } = result.data;
          res.status(200).json({ data: ret });
        } else {
          throw new ApiError("Invalid request", 400);
        }
        break;
      } catch (error) {
        throw new ApiError(error.message, 400);
      }
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
