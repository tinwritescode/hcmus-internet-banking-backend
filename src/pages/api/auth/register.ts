import { Prisma } from "@prisma/client";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { hashPassword } from "../../../lib/bcrypt";
import { getRandomBankNumber } from "../../../lib/rand";
import { CustomerService } from "../../../server/database/customerService";

const registerValidate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(registerValidate, req.body);

      const newCustomer: Prisma.CustomerCreateInput = {
        accountNumber: getRandomBankNumber().toString(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: await hashPassword(req.body.password),
      };
      const result = await CustomerService.createCustomer(newCustomer);

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
