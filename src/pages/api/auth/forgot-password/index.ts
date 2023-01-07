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
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #ddd; box-shadow: 0 2px 3px rgba(0,0,0,0.1);">
              <div style="padding: 20px; font-size: 18px;">
                <h1 style="margin: 0; font-weight: normal; font-size: 18px; color: #333;">Reset Your Password</h1>
                <p style="margin: 20px 0; font-size: 14px; color: #666;">It looks like you requested to reset your password. Click the button below to choose a new one:</p>
                <div style="text-align: center;">
                  <a href="${env.FRONTEND_URL}/reset-password?token=${token?.token}" style="display: inline-block; background-color: #4267b2; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                </div>
              </div>
              <div style="padding: 20px; font-size: 14px; color: #666;">
                <p>If you did not request a password reset, please disregard this email.</p>
                <p>This email was sent by the system.</p>
                <p>This is an automated message and does not require a response.</p>
                <p>If you have any questions or concerns, please contact our support team.</p>
              </div>
            </div>
          </div>
        `,
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
