import { Prisma } from "@prisma/client";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { hashPassword } from "../../../lib/bcrypt";
import { getRandomBankNumber } from "../../../lib/rand";
import { CustomerService } from "../../../lib/database/customerService";
import { TokenService } from "../../../lib/database/tokenService";
import { prisma } from "../../../lib/prisma";

const registerValidate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      const {
        payload: { id },
      } = await TokenService.requireEmployeeAuth(req, {
        requireEmployee: true,
        requireAdmin: true,
      });
      validateSchema(registerValidate, req.body);

      const newCustomer: Prisma.CustomerCreateInput = {
        accountNumber: getRandomBankNumber().toString(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: await hashPassword(req.body.password),
      };
      const result = await CustomerService.createCustomer(newCustomer);

      prisma.employeeLog.create({
        data: {
          employeeId: id,
          data: `Created customer ${result.id}, ${result.firstName} ${result.lastName}, ${result.email}`,
          type: "CUSTOMER_CREATE",
        },
      }),
        res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
