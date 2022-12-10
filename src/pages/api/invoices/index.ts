import { InvoiceService } from "./../../../server/database/invoiceService";
import { RecipientService } from "../../../server/database/recipientService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { TokenService } from "../../../server/database/tokenService";
import { ApiError } from "../../../base/baseResponse";

const createInvoiceSchema = z.object({
  accountNumber: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
  amount: z.preprocess(parseInt, z.number().min(1)),
  isInternalBank: z
    .preprocess((value) => value === "true", z.boolean())
    .default(true),
  message: z.string().min(1),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(createInvoiceSchema, req.body);

      const {
        payload: { id },
      } = await TokenService.requireAuth(req);
      const {
        accountNumber,
        isInternalBank = true,
        amount,
        message,
      } = req.body;
      const [customer, user] = await Promise.all([
        CustomerService.getCustomerByBankNumber(accountNumber as string),
        CustomerService.getCustomerById(id, { withBalance: true }),
      ]);
      const amountNum = parseInt(amount);

      if (user.balance < amountNum) {
        throw new ApiError("Insufficient funds", 400);
      }
      if (!isInternalBank) {
        throw new Error("External bank not supported");
      } else {
        await CustomerService.getCustomerByBankNumber(accountNumber as string);
      }

      const result = await InvoiceService.createInvoice({
        amount: amountNum,
        message,
        creator: {
          connect: {
            id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      res.status(200).json({ data: result });
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
    default: {
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
    }
  }
});
