import { z } from "zod";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { CustomerService } from "../../../../lib/database/customerService";
import { TokenService } from "../../../../lib/database/tokenService";

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

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
