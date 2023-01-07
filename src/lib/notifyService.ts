import clientNotifyService from './clientNotify';
import { InvoiceService } from './database/invoiceService';

interface InvoiceResponse {
  success: boolean;
  message?: string;
}

const invoiceNotification = async (invoiceId: number | bigint) => {
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
      const data = await invoiceNotification(invoiceId);

      const payload = {
        invoiceId,
        to: data.creator,
        from: data.customer,
        amount: data.amount,
      };

      const res = await clientNotifyService.post<InvoiceResponse>(
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

  static notificationCreateInvoice = async (
    invoiceId: number | bigint
  ): Promise<boolean> => {
    try {
      const data = await invoiceNotification(invoiceId);

      const payload = {
        invoiceId,
        from: data.creator,
        to: data.customer,
        amount: data.amount,
      };

      const res = await clientNotifyService.post<InvoiceResponse>(
        '/api/notify/create-invoice',
        {
          payload,
        }
      );

      return res.data.success;
    } catch (error) {
      console.log(error);
    }
  };

  static notificationCancelInvoice = async (
    invoiceId: number | bigint,
    reason: string,
    from: string,
    to: string
  ): Promise<boolean> => {
    try {
      const messageForCreater = `Your invoice ${invoiceId} has been deleted by the payer with reason: ${reason}`;
      const messageForCustomer = `Your invoice ${invoiceId} has been deleted by ${from}, the creator of the invoice, with reason: ${reason}`;

      const payload = {
        invoiceId,
        from,
        to,
        messageForCreater,
        messageForCustomer,
      };

      const res = await clientNotifyService.post<InvoiceResponse>(
        '/api/notify/cancel-invoice',
        {
          payload,
        }
      );

      return res.data.success;
    } catch (error) {
      console.log(error);
    }
  };
}
