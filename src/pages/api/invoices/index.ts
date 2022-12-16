import { InvoiceService } from "../../../lib/database/invoiceService";
import { custom, z } from "zod";
import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { CustomerService } from "../../../lib/database/customerService";
import { TokenService } from "../../../lib/database/tokenService";
import { ApiError } from "../../../core/baseResponse";

const createInvoiceSchema = z.object({
  accountNumber: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
  amount: z.preprocess(BigInt, z.bigint()),
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
      const { accountNumber, amount, message } = req.body;
      const customer = await CustomerService.getCustomerByBankNumber(
        accountNumber as string
      );
      const amountNum = parseInt(amount);
      const isInternalBank = req.body.isInternalBank === "true";

      console.log(req.body);

      if (!isInternalBank) {
        throw new ApiError("External bank has note supported yet.", 400);
      } else {
        await CustomerService.getCustomerByBankNumber(accountNumber as string);
        if (id === customer.accountNumber) {
          throw new ApiError("You can't pay to yourself", 400);
        }
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
      const invoices = await InvoiceService.getInvoicesByReceiverId(
        id,
        parseInt((offset as string) || "0"),
        parseInt((limit as string) || "10")
      );

      res.status(200).json({ data: invoices });
      break;
    }
    default: {
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
    }
  }
});
