// import { EmployeeService } from "./../../../../server/database/employeeService";
import { Employee } from "./../../../../../node_modules/.prisma/client/index.d";
import moment from "moment";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { env } from "../../../../core/env/server.mjs";
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
      const result = await EmployeeService.authenticateCustomer(
        email,
        password
      );

      const tokens = await Promise.all([
        TokenService.generateToken({
          type: "ADMIN_REFRESH",
          customerId: result.id,
          expiredAt: moment()
            .add(env.REFRESH_TOKEN_EXPIRES_IN_DAYS, "days")
            .toDate(),
        }),
      ]);

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
