import { z } from "zod";
import { ApiError } from "../../../../core/baseResponse";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { EmployeeService } from "../../../../lib/database/employeeService";
import { TokenService } from "../../../../lib/database/tokenService";

const refreshTokenValidate = z.object({
  refreshToken: z.string().min(1),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(refreshTokenValidate, req.body);
      const { refreshToken } = req.body;

      const isValid = await TokenService.validateRefreshToken(refreshToken, {
        isAdminToken: true,
      });

      if (!isValid) {
        throw new ApiError("Invalid refresh token", 401);
      }

      const employee = await EmployeeService.getEmployeeByRefreshToken(
        refreshToken
      );

      const result = await TokenService.generateAccessToken(
        { id: employee.id, role: "ADMIN" },
        process.env.ACCESS_TOKEN_EXPIRES_IN
      );

      res.status(200).json({ data: { accessToken: result } });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
