import { BaseResponse, PagingResponse } from "./../../base/baseResponse";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export class RecipientService {
  static defaultSelector: Prisma.RecipientSelect = {
    id: true,
    accountNumber: true,
    mnemonicName: true,
  };

  static createRecipient = async (recipient: Prisma.RecipientCreateInput) => {
    return await prisma.recipient.create({
      data: recipient,
    });
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
    offset: number = 0,
    limit: number = 10
  ) => {
    try {
      const recipients = await prisma.recipient.findMany({
        where: {
          CustomerRecipient: {
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
          CustomerRecipient: {
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
          CustomerRecipient: {
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
          CustomerRecipient: {
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
