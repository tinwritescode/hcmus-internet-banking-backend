import { comparePassword } from "./../../lib/bcrypt";
import { TokenService } from "./tokenService";
import { Prisma } from "@prisma/client";
import { ApiError } from "../../base/baseResponse";
import prisma from "../../lib/prisma";
import moment from "moment";

const defaultCustomerSelector: Prisma.CustomerSelect = {
  id: true,
  accountNumber: true,
};

export type DefaultCustomerSelector = Prisma.CustomerGetPayload<{
  select: typeof defaultCustomerSelector;
}>;

export class CustomerService {
  static createCustomer = async (customer: Prisma.CustomerCreateInput) => {
    try {
      const newCustomer = await prisma.customer.create({
        data: customer,
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
        select: defaultCustomerSelector,
      });

      const tokens = await Promise.all([
        TokenService.generateToken(
          "REFRESH",
          moment()
            .add(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d")
            .toDate()
        ).then((token) => token?.token),
        TokenService.generateAccessToken(
          { id: customer.id },
          process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
        ),
      ]);

      return {
        ...customer,
        tokens: {
          refreshToken: tokens[0],
          accessToken: tokens[1],
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError("Invalid credentials", 401);
      }

      throw new Error(error);
    }
  };
}
