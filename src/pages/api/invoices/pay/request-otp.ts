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

      await sendEmail({
        to: email,
        subject: "Pay Invoice OTP",
        html: `Your OTP is: ${token.token}`,
      });

      res.status(200).json({ data: { message: "OTP sent to your email" } });
      break;
    }
  }
});
