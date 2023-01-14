import clientNotifyService from '../clientNotify';
import { defaultCustomerSelector } from './customerService';
import { InvoiceService } from './invoiceService';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { ApiError } from '../../core/baseResponse';
import { BaseResponse } from '../../core/baseResponse';

interface InvoiceResponse {
  success: boolean;
  message?: string;
}

export interface PagingResponseNotify extends BaseResponse {
  metadata: {
    total: number;
    totalUnread: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const invoiceNotification = async (invoiceId: number | bigint) => {
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
  static defaultSelector: Prisma.NotificationSelect = {
    id: true,
    customer: { select: defaultCustomerSelector },
    customerId: true,
    createdAt: true,
    updatedAt: true,
    type: true,
    title: true,
    text: true,
    isRead: true,
    readAt: true,
  };

  static getNotifications = async (
    customerId: string,
    offset = 0,
    limit = 10
  ) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          customerId,
        },
        select: NotificationService.defaultSelector,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await prisma.notification.count({
        where: {
          customerId,
        },
      });

      const totalUnread = await prisma.notification.count({
        where: {
          customerId,
          isRead: false,
        },
      });

      const result: PagingResponseNotify = {
        data: notifications,
        metadata: {
          total: total,
          totalUnread,
          page: offset,
          limit: limit,
          hasNextPage: offset + limit < total,
          hasPrevPage: offset > 0,
        },
      };

      return result;
    } catch (error) {
      return [];
    }
  };

  static createNotification = async (
    notification: Prisma.NotificationCreateInput
  ) => {
    try {
      return prisma.notification.create({
        data: notification,
      });
    } catch (error) {
      // P2002
      if (error.code === 'P2002') {
        throw new ApiError('Invalid notification', 400);
      }

      throw new ApiError('Something went wrong', 500);
    }
  };

  static markNotificationAsRead = async (notificationId: number | bigint) => {
    try {
      return prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      // P2002
      if (error.code === 'P2002') {
        throw new ApiError('Invalid notification', 400);
      }

      throw new ApiError('Something went wrong', 500);
    }
  };

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

      await Promise.all([
        NotificationService.createNotification({
          type: 'DEBT_PAID',
          title: 'Invoice paid',
          text: JSON.stringify({
            payload,
            message: `You have paid an invoice to ${data.creator.firstName} ${data.creator.lastName}`,
          }),
          customer: {
            connect: {
              id: data.customer.id,
            },
          },
        }),

        NotificationService.createNotification({
          type: 'DEBT_PAID',
          title: 'Invoice paid',
          text: JSON.stringify({
            payload,
            message: `You have received a payment from ${data.customer.firstName} ${data.customer.lastName}`,
          }),
          customer: {
            connect: {
              id: data.creator.id,
            },
          },
        }),
      ]);

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

      await Promise.all([
        NotificationService.createNotification({
          type: 'DEBT_CREATED',
          title: 'Invoice created',
          text: JSON.stringify({
            payload,
            message: `You have created an invoice to ${data.customer.firstName} ${data.customer.lastName} with amount $${data.amount}`,
          }),
          customer: {
            connect: {
              id: data.creator.id,
            },
          },
        }),

        NotificationService.createNotification({
          type: 'DEBT_CREATED',
          title: 'Invoice created',
          text: JSON.stringify({
            payload,
            message: `You have created an invoice from ${data.creator.firstName} ${data.creator.lastName} with amount $${data.amount}`,
          }),
          customer: {
            connect: {
              id: data.customer.id,
            },
          },
        }),
      ]);

      return res.data.success;
    } catch (error) {
      console.log(error);
    }
  };

  static notificationCancelInvoice = async (
    invoiceId: number | bigint,
    reason: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    to: any
  ): Promise<boolean> => {
    try {
      const messageForCreater = `Invoice #${invoiceId} has been deleted with reason: ${reason}`;
      const messageForCustomer = `Invoice #${invoiceId} has been deleted with reason: ${reason}`;

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

      await Promise.all([
        NotificationService.createNotification({
          type: 'DEBT_DELETED',
          title: 'Invoice canceled',
          text: JSON.stringify({
            payload,
            message: messageForCreater,
          }),
          customer: {
            connect: {
              id: from.id,
            },
          },
        }),

        NotificationService.createNotification({
          type: 'DEBT_DELETED',
          title: 'Invoice canceled',
          text: JSON.stringify({
            payload,
            message: messageForCustomer,
          }),
          customer: {
            connect: {
              id: to.id,
            },
          },
        }),
      ]);

      return res.data.success;
    } catch (error) {
      console.log(error);
    }
  };
}
