import { ApiError } from "./../../../base/baseResponse";
import { GoogleRecaptchaService } from "./../../../server/googleRecaptchaService";
import { TokenService } from "./../../../server/database/tokenService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { NextApiRequest } from "next";

const loginValidate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  captchaValue: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(loginValidate, req.body);
      await TokenService.requireNotAuth(req);

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
