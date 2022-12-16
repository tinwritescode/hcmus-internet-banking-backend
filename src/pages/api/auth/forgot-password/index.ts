import moment from "moment";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { env } from "../../../../core/env/server.mjs";
import { CustomerService } from "../../../../lib/database/customerService";
import { TokenService } from "../../../../lib/database/tokenService";
import { sendEmail } from "../../../../lib/nodemailer";

const forgotPassword = z.object({
  email: z.string().email(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(forgotPassword, req.body);

      // eslint-disable-next-line no-case-declarations
      const { email } = forgotPassword.parse(req.body);

      const customerId = (await CustomerService.getCustomerByEmail(email)).id;

      const token = await TokenService.generateToken({
        type: "RESET_PASSWORD",
        customerId,
        expiredAt: moment()
          .add(env.RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTE, "minutes")
          .toDate(),
      });

      sendEmail({
        to: email,
        subject: "Reset your password",
        html: `<p>Click <a href="${env.FRONTEND_URL}/reset-password?token=${token?.token}">here</a> to reset your password.</p>`,
      });

      res.status(200).json({
        data: {
          message:
            "We have sent you an email with a link to reset your password.",
        },
      });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
