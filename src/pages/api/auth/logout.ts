import { validateSchema } from "./../../../base/catchAsync";
import { TokenService } from "./../../../server/database/tokenService";
import { catchAsync } from "../../../base/catchAsync";
import { z } from "zod";

const logoutValidate = z.object({
  refreshToken: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(logoutValidate, req.body);
      await TokenService.requireAuth(req);
      const { refreshToken } = req.body;

      const result = await TokenService.blackListToken(refreshToken);

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
