import { ApiError } from "next/dist/server/api-utils";
import { catchAsync } from "../../../../core/catchAsync";
import { InvoiceService } from "../../../../lib/database/invoiceService";
import { TokenService } from "../../../../lib/database/tokenService";

// pay
export default catchAsync(async function handle(req, res) {
  const invoiceId = BigInt(req.query.invoiceId as string);

  switch (req.method) {
    case "POST": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);
      const canPay = await InvoiceService.canPayInvoice(invoiceId, id);
      if (!canPay) {
        throw new ApiError(403, "You can't pay this invoice");
      }
      const result = await InvoiceService.payInvoice({
        id: invoiceId,
        payerId: id,
      });
      res.status(200).json({ data: result });
      break;
    }
  }
});
