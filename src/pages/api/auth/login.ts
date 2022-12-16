import { ApiError } from "../../../core/baseResponse";
import { GoogleRecaptchaService } from "../../../lib/googleRecaptchaService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { CustomerService } from "../../../lib/database/customerService";

const loginValidate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  captchaValue: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(loginValidate, req.body);

      // eslint-disable-next-line no-case-declarations
      const { email, password, captchaValue } = req.body;

      if (!(await GoogleRecaptchaService.validateRecaptcha(captchaValue))) {
        throw new ApiError("Invalid captcha", 400);
      }

      const result = await CustomerService.authenticateCustomer(
        email,
        password
      );

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
