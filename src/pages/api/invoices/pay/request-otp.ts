import { CustomerService } from "./../../../../lib/database/customerService";
import { sendEmail } from "./../../../../lib/nodemailer";
import { catchAsync } from "../../../../core/catchAsync";
import { TokenService } from "../../../../lib/database/tokenService";

// pay
export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const token = await TokenService.generateToken({
        type: "PAY_INVOICE",
        expiredAt: new Date(Date.now() + 1000 * 60 * 5),
      });

      const email = (
        await CustomerService.getCustomerById(id, {
          withEmail: true,
        })
      ).email;

      sendEmail({
        to: email,
        subject: "Pay Invoice OTP",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #333;">Pay Invoice OTP</h1>
            <hr style="border: 1px solid #ddd; margin: 20px 0;">
            <div style="font-size: 18px; margin-bottom: 20px;">
              <p>Use this one-time password to pay the invoice:</p>
              <div style="background-color: #f1f1f1; padding: 10px; font-size: 24px; text-align: center;">${token.token}</div>
            </div>
            <hr style="border: 1px solid #ddd; margin: 20px 0;">
            <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
              <p>This email was sent by the system.</p>
              <p>This is an automated message and does not require a response.</p>
              <p>If you have any questions or concerns, please contact our support team.</p>
            </div>
          </div>
        `,
      });

      res.status(200).json({ data: { message: "OTP sent to your email" } });
      break;
    }
  }
});
