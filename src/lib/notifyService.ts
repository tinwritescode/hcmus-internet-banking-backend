import clientNotifyService from './clientNotify';
import { InvoiceService } from './database/invoiceService';

interface PayInvoiceResponse {
  success: boolean;
  message?: string;
}

const payInvoiceNotification = async (invoiceId: number | bigint) => {
  const invoice = await InvoiceService.getInvoiceById(invoiceId);
  const creator = invoice?.creator;
  const customer = invoice?.customer;
  const amount = invoice?.amount;

  const result = {
    invoiceId,
    creator,
    customer,
    amount,
  };

  return result;
};

export class NotificationService {
  static notificationPayInvoice = async (
    invoiceId: number | bigint
  ): Promise<boolean> => {
    try {
      const data = await payInvoiceNotification(invoiceId);

      const payload = {
        invoiceId,
        to: data.creator,
        from: data.customer,
        amount: data.amount,
      };

      const res = await clientNotifyService.post<PayInvoiceResponse>(
        '/api/notify/pay-invoice',
        {
          payload,
        }
      );

      return res.data.success;
    } catch (error) {
      console.log(error);
    }
  };

  //   static notifyCreateInvoice = async (token: string): Promise<boolean> => {

  //     const response = await fetch(process.env.RECAPTCHA_VERIFY_URL || '', {
  //       method: 'POST',

  //       headers: {
  //         // eslint-disable-next-line @typescript-eslint/naming-convention
  //         'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  //       },

  //       body: JSON.stringify({
  //         secret,
  //         response: token,
  //       }),
  //     });

  //     const data = await response.json();
  //     const isVerified = data.success;

  //     return isVerified;
  //   };

  //   static notiyCancelInvoice = async (token: string): Promise<boolean> => {
  //     return new Promise((resolveOuter) => {
  //       resolveOuter(
  //         new Promise((resolveInner) => {
  //           setTimeout(resolveInner, 1000);
  //         })
  //       );
  //     });
  //   };
}
