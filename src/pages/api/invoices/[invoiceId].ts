import { InvoiceService } from "../../../lib/database/invoiceService";
import { validateSchema } from "../../../core/catchAsync";
import { z } from "zod";
import { catchAsync } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";
import { ApiError } from "../../../core/baseResponse";

const updateInvoiceSchema = z.object({
  amount: z.preprocess(BigInt, z.bigint()),
  message: z.string().min(1),
});

export default catchAsync(async function handle(req, res) {
  const invoiceId = BigInt(req.query.invoiceId as string);

  switch (req.method) {
    case "DELETE": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const canDelete = await InvoiceService.canDeleteInvoice(invoiceId, id);

      if (!canDelete) {
        throw new ApiError("You can't delete this invoice", 403);
      }

      const result = await InvoiceService.deleteInvoice(invoiceId);

      res.status(200).json({ data: result });
      break;
    }
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const canGet = await InvoiceService.canGetInvoice(invoiceId, id);

      if (!canGet) {
        throw new ApiError("You can't get this invoice", 403);
      }

      const invoices = await InvoiceService.getInvoiceById(invoiceId);

      res.status(200).json({ data: invoices });
      break;
    }
    case "PUT": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      validateSchema(updateInvoiceSchema, req.body);

      const canUpdate = await InvoiceService.canUpdateInvoice(invoiceId, id);
      if (!canUpdate) {
        throw new ApiError("You can't update this invoice", 403);
      }

      const destInvoice = await InvoiceService.getInvoiceById(invoiceId);
      if (!destInvoice) {
        throw new ApiError("Invoice not found", 404);
      }
      if (destInvoice.isPaid) {
        throw new ApiError("You can't update a paid invoice", 403);
      }

      const { amount, message } = req.body;
      if (amount <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      const invoice = await InvoiceService.updateInvoice(invoiceId, {
        amount: amount,
        message: message,
        updatedAt: new Date(),
      });

      res.status(200).json({ data: invoice });
      break;
    }
    default: {
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
    }
  }
});
