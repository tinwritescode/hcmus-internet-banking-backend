import { RecipientService } from "./recipientService";
import { defaultCustomerSelector } from "./customerService";
import { ApiError, PagingResponse } from "./../../base/baseResponse";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export class TransactionService {
  static defaultSelector: Prisma.TransactionSelect = {
    amount: true,
    createdAt: true,
    fromCustomer: { select: defaultCustomerSelector },
    // recipient: { select: RecipientService.defaultSelector },
    message: true,
    id: true,
    type: true,
  };

  static createTransaction = async (
    recipient: Prisma.TransactionCreateInput
  ) => {
    try {
      return await prisma.transaction.create({
        data: recipient,
      });
    } catch (error) {
      // P2002
      if (error.code === "P2002") {
        throw new ApiError("Invalid recipient", 400);
      }

      throw new ApiError("Something went wrong", 500);
    }
  };

  static getTransactionsByCustomerId = async (
    customerId: string,
    offset = 0,
    limit = 10
  ) => {
    try {
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            fromCustomerId: customerId,
          },
          select: TransactionService.defaultSelector,
          skip: offset,
          take: limit,
        }),
        prisma.transaction.count({
          where: {
            fromCustomerId: customerId,
          },
        }),
      ]);

      const result: PagingResponse = {
        data: transactions,
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

  static canGetTransaction = async (transactionId: string, id: string) => {
    // TODO: Change later to match the need
    return true;
  };
}
