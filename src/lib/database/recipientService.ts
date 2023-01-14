import { ApiError, PagingResponse } from "../../core/baseResponse";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export class RecipientService {
  static defaultSelector: Prisma.RecipientSelect = {
    id: true,
    accountNumber: true,
    mnemonicName: true,
    internalBankCustomer: {
      select: {
        id: true,
        accountNumber: true,
        lastName: true,
        firstName: true,
      },
    },
  };

  static createRecipient = async (recipient: Prisma.RecipientCreateInput) => {
    try {
      // create or connect if recipient already exists
      return await prisma.recipient.upsert({
        where: {
          accountNumber: recipient.accountNumber,
        },
        create: recipient,
        update: recipient,
      });
    } catch (error) {
      // P2002
      if (error.code === "P2002") {
        throw new ApiError("Recipient already exists", 400);
      }

      throw new ApiError("Something went wrong", 500);
    }
  };

  static deleteRecipient = async (id: string) => {
    return await prisma.recipient.delete({
      where: {
        id,
      },
    });
  };

  static getRecipientById = async (
    id: string
  ): Promise<Prisma.RecipientGetPayload<{
    select: typeof RecipientService.defaultSelector;
  }> | null> => {
    try {
      const recipient = await prisma.recipient.findUnique({
        where: {
          id: id,
        },
        select: RecipientService.defaultSelector,
      });

      return recipient;
    } catch (error) {
      return null;
    }
  };

  static getRecipientsByCustomerId = async (
    customerId: string,
    offset = 0,
    limit = 10
  ) => {
    try {
      const recipients = await prisma.recipient.findMany({
        where: {
          customerRecipient: {
            some: {
              customerId: customerId,
            },
          },
        },
        select: RecipientService.defaultSelector,
        skip: offset,
        take: limit,
      });

      const total = await prisma.recipient.count({
        where: {
          customerRecipient: {
            some: {
              customerId: customerId,
            },
          },
        },
      });

      const result: PagingResponse = {
        data: recipients,
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

  static canDeleteRecipient = async (recipientId: string, id: string) => {
    // TODO: employee can delete recipient too
    return (
      prisma.recipient.findFirst({
        where: {
          id: recipientId,
          customerRecipient: {
            some: {
              customerId: id,
            },
          },
        },
      }) !== null
    );
  };

  static canGetRecipient = async (recipientId: string, id: string) => {
    // TODO: Change later to match the need
    return true;
  };

  static canUpdateRecipient = async (recipientId: string, id: string) => {
    return (
      prisma.recipient.findFirst({
        where: {
          id: recipientId,
          customerRecipient: {
            some: {
              customerId: id,
            },
          },
        },
      }) !== null
    );
  };

  static updateRecipient = async (
    id: string,
    recipient: Prisma.RecipientUpdateInput
  ) => {
    return await prisma.recipient.update({
      where: {
        id,
      },
      data: recipient,
    });
  };
}
