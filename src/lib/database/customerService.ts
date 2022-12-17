import { comparePassword, hashPassword } from "../bcrypt";
import { TokenService } from "./tokenService";
import { Prisma, TokenType } from "@prisma/client";
import { ApiError } from "../../core/baseResponse";
import { prisma } from "../prisma";
import moment from "moment";
import { env } from "../../core/env/server.mjs";

export const defaultCustomerSelector: Prisma.CustomerSelect = {
  id: true,
  accountNumber: true,
  lastName: true,
  firstName: true,
};

export type DefaultCustomerSelector = Prisma.CustomerGetPayload<{
  select: typeof defaultCustomerSelector;
}>;

export class CustomerService {
  static createCustomer = async (customer: Prisma.CustomerCreateInput) => {
    try {
      const isDev = process.env.NODE_ENV === "development";

      const newCustomer = await prisma.customer.create({
        data: {
          ...customer,
          balance: (isDev && 11e9) || 0,
        },
        select: {
          ...defaultCustomerSelector,
          email: true,
        },
      });

      return newCustomer;
    } catch (error) {
      if (error.code === "P2002") {
        throw new ApiError("Email already exists", 400);
      }

      throw error;
    }
  };

  static authenticateCustomer = async (email: string, password: string) => {
    try {
      const hashedPassword = (
        await prisma.customer.findFirstOrThrow({
          where: { email },
          select: {
            password: true,
          },
        })
      ).password;

      const isPasswordValid = await comparePassword(password, hashedPassword);

      if (!isPasswordValid) {
        throw new ApiError("Invalid credentials", 401);
      }

      const customer = await prisma.customer.findFirst({
        where: { email },
        select: {
          ...defaultCustomerSelector,
        },
      });

      if (!customer) {
        throw new ApiError("Invalid credentials", 401);
      }

      const [refreshToken, accessToken] = await Promise.all([
        TokenService.generateToken({
          type: TokenType.REFRESH,
          expiredAt: moment()
            .add(
              parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 30,
              "days"
            )
            .toDate(),

          customerId: customer.id,
        }).then((token) => token?.token),
        TokenService.generateAccessToken(
          { id: customer.id },
          process.env.ACCESS_TOKEN_EXPIRES_IN
        ),
      ]);

      return {
        ...customer,
        tokens: {
          refreshToken: refreshToken,
          accessToken: accessToken,
        },
      };
    } catch (error) {
      if (error instanceof ApiError || error.code === "P2025") {
        throw new ApiError("Invalid credentials", 401);
      }
    }
  };

  static transferInternally = async ({
    amount,
    from,
    to,
    message,
    payer,
  }: {
    from: string;
    to: string;
    amount: bigint | number;
    message: string;
    payer: "sender" | "receiver";
  }) => {
    if (from === to) {
      throw new ApiError("You can't transfer to yourself", 400);
    }
    console.log("from", from);
    console.log("to", to);

    await prisma.customer
      .findUniqueOrThrow({
        where: { id: to },
      })
      .catch(() => {
        throw new ApiError("Invalid recipient", 400);
      });

    const customer = await prisma.customer
      .findUniqueOrThrow({
        where: { id: from },
      })
      .catch(() => {
        throw new ApiError("Invalid sender", 400);
      });

    if (customer.balance < amount) {
      throw new ApiError("Insufficient balance", 400);
    }

    const session = await prisma.$transaction([
      prisma.customer.update({
        where: { id: from },
        data: {
          balance: {
            decrement: amount,
          },
        },
        select: {
          ...defaultCustomerSelector,
          balance: true,
        },
      }),
      prisma.customer.update({
        where: { id: to },
        data: {
          balance: {
            increment: amount,
          },
        },
        select: {
          ...defaultCustomerSelector,
        },
      }),
      prisma.transaction.create({
        data: {
          amount,
          message,
          type: "INTERNAL",
          fromCustomer: { connect: { id: from } },
          toCustomer: { connect: { id: to } },
        },
        select: {
          id: true,
          amount: true,
          fromCustomerId: true,
          toCustomerId: true,
          recipientId: true,
        },
      }),
      prisma.customer.update({
        where: { id: payer === "sender" ? from : to },
        data: {
          balance: {
            decrement: (amount as bigint) * BigInt(env.BASE_FEE),
          },
        },
      }),
    ]);

    return {
      from: session[0],
      to: session[1],
      transaction: session[2],
    };
  };

  // Receive money from another bank
  static dangerouslyReceiveMoney = async ({
    amount,
    from,
    to,
    message,
    payer,
  }: {
    from: string;
    to: string;
    amount: bigint | number;
    message: string;
    payer: "receiver" | null;
  }) => {
    // check if the customer exists
    await prisma.customer
      .findUniqueOrThrow({
        where: { id: to },
      })
      .catch(() => {
        throw new ApiError("Invalid recipient", 400);
      });

    // if payer is receiver, deduct the base fee
    const amountAfterFee =
      BigInt(amount) -
      (amount as bigint) *
        BigInt(env.BASE_FEE) *
        (payer === "receiver" ? 1n : 0n);

    const session = await prisma.$transaction([
      prisma.customer.update({
        where: { id: to },
        data: {
          balance: {
            increment: amountAfterFee,
          },
        },
        select: {
          ...defaultCustomerSelector,
        },
      }),
      prisma.transaction.create({
        data: {
          amount,
          message,
          type: "EXTERNAL",
          fromRecipient: {
            connectOrCreate: {
              where: { accountNumber: from },
              create: {
                accountNumber: from,
              },
            },
          },
          toCustomer: { connect: { id: to } },
        },
        select: {
          id: true,
          amount: true,
          fromCustomerId: true,
          toCustomerId: true,
          recipientId: true,
        },
      }),
    ]);

    return {
      from: from,
      to: session[0],
      transaction: session[1],
    };
  };

  static getCustomerIdByBankNumber = async (to: string) => {
    return (
      await prisma.customer.findUnique({
        where: { accountNumber: to },
        select: { id: true },
      })
    )?.id;
  };

  static getCustomerByBankNumber = async (to: string) => {
    return await prisma.customer.findUniqueOrThrow({
      where: { accountNumber: to },
      select: { ...defaultCustomerSelector },
    });
  };

  static getCustomerById = async (
    id: string,
    {
      withBalance = false,
      withEmail = false,
    }: { withBalance?: boolean; withEmail?: boolean }
  ) => {
    return await prisma.customer.findUnique({
      where: { id },
      select: {
        ...defaultCustomerSelector,
        ...(withBalance && { balance: true }),
        ...(withEmail && { email: true }),
      },
    });
  };

  static getCustomerByRefreshToken = async (refreshToken: string) => {
    const token = await TokenService.getToken(refreshToken);

    if (!token) {
      throw new ApiError("Invalid token", 401);
    }

    return CustomerService.getCustomerById(token.customerId, {
      withBalance: true,
    });
  };

  static updateCustomer = async (
    id: string,
    data: Prisma.CustomerUpdateInput
  ) => {
    return await prisma.customer.update({
      where: { id },
      data,
      select: {
        ...defaultCustomerSelector,
      },
    });
  };

  static isValidPassword = async (id: string, password: string) => {
    const hashedPassword = (
      await prisma.customer.findFirstOrThrow({
        where: { id },
        select: {
          password: true,
        },
      })
    ).password;

    return await comparePassword(password, hashedPassword);
  };

  static getCustomerByEmail = async (email: string) => {
    return await prisma.customer.findUnique({
      where: { email },
      select: {
        ...defaultCustomerSelector,
      },
    });
  };

  static updatePassword = async (id: string, password: string) => {
    return await prisma.customer.update({
      where: { id },
      data: {
        password: await hashPassword(password),
      },
      select: {
        ...defaultCustomerSelector,
      },
    });
  };
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
