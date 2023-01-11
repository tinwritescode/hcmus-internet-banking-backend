import { validateSchema } from './../../../../core/catchAsync';
import { z } from 'zod';
import { catchAsync } from '../../../../core/catchAsync';
import { InvoiceService } from '../../../../lib/database/invoiceService';
import { TokenService } from '../../../../lib/database/tokenService';
import { ApiError } from '../../../../core/baseResponse';
import { NotificationService } from '../../../../lib/database/notifyService';

const postPayInvoiceSchema = z.object({
  otp: z.string().min(1),
});

// pay
export default catchAsync(async function handle(req, res) {
  const invoiceId = BigInt(req.query.invoiceId as string);

  switch (req.method) {
    case 'POST': {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { otp } = validateSchema(
        postPayInvoiceSchema,
        req.body || {
          otp: '',
        }
      );

      const isValid = await TokenService.validatePayInvoiceToken(otp);
      if (!isValid) {
        throw new ApiError('Invalid OTP', 403);
      }

      const canPay = await InvoiceService.canPayInvoice(invoiceId, id);
      if (!canPay) {
        throw new ApiError("You can't pay this invoice", 403);
      }
      const result = await InvoiceService.payInvoice({
        id: invoiceId,
        payerId: id,
      });

      await Promise.all([
        NotificationService.notificationPayInvoice(invoiceId),
      ]);
      res.status(200).json({ data: result });
      break;
    }
  }
});
