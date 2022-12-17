import { sendEmail } from "./../nodemailer";
import { CustomerService, defaultCustomerSelector } from "./customerService";
import { ApiError, PagingResponse } from "../../core/baseResponse";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export class InvoiceService {
  static defaultSelector: Prisma.InvoiceSelect = {
    id: true,
    amount: true,
    creator: {
      select: defaultCustomerSelector,
    },
    customer: {
      select: defaultCustomerSelector,
    },
    isPaid: true,
    paidAt: true,
    message: true,
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
    const result = await prisma.invoice.delete({
      where: {
        id,
      },
      include: {
        creator: {
          select: {
            ...defaultCustomerSelector,
            email: true,
          },
        },
      },
    });

    if (result === null) {
      throw new ApiError("Invoice not found", 404);
    }

    sendEmail({
      to: result.receiverId,
      subject: "Invoice deleted",
      html: `Invoice ${result.id} has been deleted\nCreator: ${
        result.creator.firstName
      } ${result.creator.lastName}\nAmount: ${result.amount}\n${
        result.isPaid ? "Paid at: " + result.paidAt : ""
      }}`,
    });

    return result;
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

  static getInvoices = async ({
    creatorId,
    offset = 0,
    limit = 10,
    isPaid,
    type,
  }: {
    creatorId: string;
    isPaid?: boolean;
    offset?: number;
    limit?: number;
    type?: "created" | "received";
  }) => {
    const whereClause =
      type === "created"
        ? {
            creatorId: creatorId,
          }
        : type === "received"
        ? {
            receiverId: creatorId,
          }
        : {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            OR: [
              {
                creatorId: creatorId,
              },
              {
                receiverId: creatorId,
              },
            ],
          };
    console.table(whereClause);

    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          ...whereClause,
          isPaid: isPaid ?? undefined,
        },
        select: InvoiceService.defaultSelector,
        skip: offset,
        take: limit,
      });

      const total = await prisma.invoice.count({
        where: {
          ...whereClause,
          isPaid: isPaid ?? undefined,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canGetInvoice = async (invoiceId: number | bigint, id: string) => {
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

  static canPayInvoice = async (invoiceId: number | bigint, id: string) => {
    return (
      prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          receiverId: id,
        },
      }) !== null
    );
  };

  static payInvoice = async ({
    id,
    payerId,
  }: {
    id: number | bigint;
    payerId: string;
  }) => {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
      },
    });
    if (invoice === null) throw new ApiError("Invoice not found", 404);
    if (invoice.isPaid) throw new ApiError("Invoice already paid", 400);
    if (invoice.receiverId !== payerId)
      throw new ApiError("You are not the receiver of this invoice", 400);

    const receiver = await CustomerService.getCustomerById(
      invoice.receiverId,
      {}
    );
    if (receiver === null) throw new ApiError("Receiver not found", 404);
    if (receiver.balance < invoice.amount)
      throw new ApiError("Not enough balance", 400);

    const result = await prisma.$transaction([
      prisma.invoice.update({
        where: {
          id,
        },
        data: {
          isPaid: true,
          paidAt: new Date(),
        },
      }),
      prisma.customer.update({
        where: {
          id: invoice.receiverId,
        },
        data: {
          balance: {
            decrement: invoice.amount,
          },
        },
      }),
      prisma.customer.update({
        where: {
          id: invoice.creatorId,
        },
        data: {
          balance: {
            increment: invoice.amount,
          },
        },
      }),
    ]);

    return result[0];
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
