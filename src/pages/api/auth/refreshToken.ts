import { TokenType } from "@prisma/client";
import { TokenService } from "../../../server/database/tokenService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { ApiError } from "../../../base/baseResponse";
import moment from "moment";

const refreshTokenValidate = z.object({
  refreshToken: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(refreshTokenValidate, req.body);
      const { refreshToken } = req.body;

      const isValid = await TokenService.validateRefreshToken(refreshToken);

      if (!isValid) {
        throw new ApiError("Invalid refresh token", 401);
      }

      const customer = await CustomerService.getCustomerByRefreshToken(
        refreshToken
      );

      const result = await TokenService.generateAccessToken(
        { id: customer.id },
        process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
      );

      res.status(200).json({ data: { accessToken: result } });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
