import {
  ApiError,
  BaseResponse,
  PagingResponse,
} from "../../base/baseResponse";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export class InvoiceService {
  static defaultSelector: Prisma.InvoiceSelect = {
    id: true,
    amount: true,
    creator: true,
    customer: true,
    isPaid: true,
    paidAt: true,
    updatedAt: true,
    createdAt: true,
  };

  static createInvoice = async (invoice: Prisma.InvoiceCreateInput) => {
    try {
      return await prisma.invoice.create({
        data: invoice,
      });
    } catch (error) {
      // P2002
      if (error.code === "P2002") {
        throw new ApiError("Invoice already exists", 400);
      }

      throw new ApiError("Something went wrong", 500);
    }
  };

  static deleteInvoice = async (id: number | bigint) => {
    return await prisma.invoice.delete({
      where: {
        id,
      },
    });
  };

  static getInvoiceById = async (
    id: number | bigint
  ): Promise<Prisma.InvoiceGetPayload<{
    select: typeof InvoiceService.defaultSelector;
  }> | null> => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: {
          id: id,
        },
        select: InvoiceService.defaultSelector,
      });

      return invoice;
    } catch (error) {
      return null;
    }
  };

  static getInvoicesByCreatorId = async (
    customerId: string,
    offset = 0,
    limit = 10
  ) => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          creatorId: customerId,
        },
        select: InvoiceService.defaultSelector,
        skip: offset,
        take: limit,
      });

      const total = await prisma.invoice.count({
        where: {
          creatorId: customerId,
        },
      });

      const result: PagingResponse = {
        data: invoices,
        metadata: {
          total: total,
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

  static canDeleteInvoice = async (invoiceId: number | bigint, id: string) => {
    // TODO: employee can delete Invoice too
    return (
      prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          creatorId: id,
        },
      }) !== null
    );
  };

  static getInvoice = async (invoiceId: string, id: string) => {
    // TODO: Change later to match the need
    return true;
  };

  static canUpdateInvoice = async (invoiceId: number | bigint, id: string) => {
    return (
      prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          creatorId: id,
        },
      }) !== null
    );
  };

  static updateInvoice = async (
    id: number | bigint,
    invoice: Prisma.InvoiceUpdateInput
  ) => {
    return await prisma.invoice.update({
      where: {
        id,
      },
      data: invoice,
    });
  };
}
