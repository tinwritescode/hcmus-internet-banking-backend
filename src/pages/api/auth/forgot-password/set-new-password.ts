import { z } from "zod";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { CustomerService } from "../../../../lib/database/customerService";
import { TokenService } from "../../../../lib/database/tokenService";

const forgotPassword = z.object({
  token: z.string(),
  newPassword: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(forgotPassword, req.body);

      // eslint-disable-next-line no-case-declarations
      const { token, newPassword } = forgotPassword.parse(req.body);
      const isValid = await TokenService.validateResetPasswordToken(token);
      if (!isValid) {
        res.status(400).json({
          error: { message: "Invalid token" },
        });
        return;
      }

      const customerId = (await TokenService.getToken(token)).customerId;

      await TokenService.blackListToken(token);
      await CustomerService.updatePassword(customerId, newPassword);

      res.status(200).json({
        data: {
          message: "Password has been updated",
        },
      });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
