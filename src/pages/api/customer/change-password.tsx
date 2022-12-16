import { RecipientService } from "../../../lib/database/recipientService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { CustomerService } from "../../../lib/database/customerService";
import { TokenService } from "../../../lib/database/tokenService";
import { hashPassword } from "../../../lib/bcrypt";

const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
  newPassword: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(changePasswordSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { newPassword, oldPassword } = changePasswordSchema.parse(req.body);

      const customer = await CustomerService.isValidPassword(id, oldPassword);
      if (!customer) {
        throw new Error("Invalid password");
      }

      await CustomerService.updateCustomer(id, {
        password: await hashPassword(newPassword),
      });

      res.status(200).json({ data: "Password changed" });
      break;
    }
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { offset, limit } = req.query;
      const recipients = await RecipientService.getRecipientsByCustomerId(
        id,
        parseInt((offset as string) || "0"),
        parseInt((limit as string) || "10")
      );

      res.status(200).json({ data: recipients });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
