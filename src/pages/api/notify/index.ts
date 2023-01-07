import { catchAsync } from '../../../core/catchAsync';
import { NotificationService } from '../../../lib/notifyService';

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case 'POST': {
      try {
        // const invoiceId = BigInt(req.body.invoiceId as string);
        // const result = await NotificationService.payInvoiceNotification(
        //   invoiceId
        // );
        // res.status(200).json({ data: result });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }

      break;
    }
    default:
      res.status(405).json({
        error: { message: 'Method not allowed' },
      });
  }
});
