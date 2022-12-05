import { TokenService } from "./../../../server/database/tokenService";
import { catchAsync } from "../../../base/catchAsync";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      const { token } = await TokenService.requireAuth(req);

      const result = await TokenService.blackListToken(token);

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
