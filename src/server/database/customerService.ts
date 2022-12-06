import { comparePassword } from "./../../lib/bcrypt";
import { TokenService } from "./tokenService";
import { Prisma, TokenType } from "@prisma/client";
import { ApiError } from "../../base/baseResponse";
import prisma from "../../lib/prisma";
import moment from "moment";

const defaultCustomerSelector: Prisma.CustomerSelect = {
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
          process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
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

  static transferToAnotherAccount = async ({
    amount,
    from,
    to,
  }: {
    from: string;
    to: string;
    amount: bigint;
  }) => {
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
    ]);

    return {
      from: session[0],
      to: session[1],
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
    return await prisma.customer.findUnique({
      where: { accountNumber: to },
      select: { ...defaultCustomerSelector },
    });
  };

  static getCustomerById = async (
    id: string,
    { withBalance = false }: { withBalance: boolean }
  ) => {
    return await prisma.customer.findUnique({
      where: { id },
      select: {
        ...defaultCustomerSelector,
        ...(withBalance && { balance: true }),
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
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
