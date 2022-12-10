import { InvoiceService } from "./../../../server/database/invoiceService";
import { RecipientService } from "../../../server/database/recipientService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { TokenService } from "../../../server/database/tokenService";

const createInvoiceSchema = z.object({
  accountNumber: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
  mnemonicName: z
    .string()
    .max(50, { message: "Mnemonic name is longer than 50 characters" })
    .optional(),
  isInternalBank: z
    .preprocess((value) => value === "true", z.boolean())
    .default(true),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(createInvoiceSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { accountNumber } = req.body;
      const mnemonicName = req.body.mnemonicName;
      const isInternalBank = req.body.isInternalBank || true;
      const customer = await CustomerService.getCustomerByBankNumber(
        accountNumber as string
      );
      const amount = parseInt(req.body.amount);

      if (isInternalBank) {
        await CustomerService.getCustomerByBankNumber(accountNumber as string);
      }

      const result = await InvoiceService.createInvoice({
        amount: 100,
        creator: {
          connect: {
            id,
          },
        },
        customer: {
          connect: {
            id,
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
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
