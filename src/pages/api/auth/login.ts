import { setCookie } from "nookies";
import {
  COOKIES_TOKEN_NAME,
  TokenService,
} from "./../../../server/database/tokenService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";

const loginValidate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(loginValidate, req.body);
      await TokenService.requireNotAuth(req);

      const { email, password } = req.body;
      const result = await CustomerService.authenticateCustomer(
        email,
        password
      );

      setCookie({ res }, COOKIES_TOKEN_NAME, result.tokens.accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
