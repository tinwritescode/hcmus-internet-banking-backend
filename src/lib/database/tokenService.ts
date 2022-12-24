import { ApiError } from "../../core/baseResponse";
import { EmployeeType, Prisma, TokenType } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextApiRequest } from "next";

const defaultTokenSelector: Prisma.TokenSelect = {
  id: true,
  token: true,
  expiredAt: true,
};

export type DefaultTokenSelector = Prisma.TokenGetPayload<{
  select: typeof defaultTokenSelector;
}>;

export interface AccessTokenPayload extends JwtPayload {
  id: string;
}

export const COOKIES_TOKEN_NAME = "accessToken";

export class TokenService {
  static generateToken = async ({
    expiredAt,
    type,
    customerId,
    employeeId,
  }: {
    type: TokenType;
    expiredAt: Date;
    // if have customer Id, then no employee Id and vice versa
    customerId?: string;
    employeeId?: string;
  }): Promise<DefaultTokenSelector | null> => {
    if (customerId && employeeId)
      throw new Error("Both customer and employee id provided");

    try {
      const token = await prisma.token.create({
        data: {
          type,
          expiredAt,
          token: randomUUID(),
          customer: customerId && {
            connect: {
              id: customerId,
            },
          },
          employee: employeeId && {
            connect: {
              id: employeeId,
            },
          },
        },
        select: defaultTokenSelector,
      });

      return token;
    } catch (error) {
      throw new Error(error);
    }
  };

  static generateAccessToken = async (
    payload: AccessTokenPayload,
    expiresIn: string
  ): Promise<string | null> => {
    const secret = process.env.JWT_SECRET || "xinchaocacbanlailachaod4y";

    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn }, (err, token) => {
        if (err) {
          reject(err);
        }

        resolve(token);
      });
    });
  };

  static getToken = async (
    token: string
  ): Promise<DefaultTokenSelector | null> => {
    const tokenData = await prisma.token.findFirst({
      where: { token },
    });

    return tokenData;
  };

  static validateAccessToken = async (
    token: string
  ): Promise<AccessTokenPayload> => {
    // skip bearer if there is any
    const accessToken = token.replace("Bearer ", "");

    const secret = process.env.JWT_SECRET
      ? process.env.JWT_SECRET
      : "xinchaocacbanlailachaod4y";

    return new Promise((resolve, reject) => {
      jwt.verify(accessToken, secret, (err, decoded) => {
        if (err) {
          reject(err);
        }

        resolve(decoded as AccessTokenPayload);
      });
    });
  };

  static requireAuth = async (
    req: NextApiRequest
  ): Promise<{ payload: AccessTokenPayload; token: string }> => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError("Unauthorized", 401);
    }

    try {
      const decoded = await TokenService.validateAccessToken(token);

      return { payload: decoded, token };
    } catch (error) {
      throw new ApiError("Unauthorized", 401);
    }
  };

  static requireEmployeeAuth = async (
    req: NextApiRequest,
    options: { requireAdmin?: boolean; requireEmployee?: boolean } = {
      requireAdmin: false,
      requireEmployee: false,
    }
  ): Promise<{ payload: AccessTokenPayload; token: string }> => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError("Unauthorized", 401);
    }

    try {
      const decoded = await TokenService.validateAccessToken(token);

      if (options?.requireAdmin && options?.requireEmployee) {
        // either
        if (
          decoded.role !== EmployeeType.ADMIN &&
          decoded.role !== EmployeeType.EMPLOYEE
        )
          throw new ApiError("Unauthorized", 401);
      } else {
        if (options?.requireAdmin && decoded.role !== EmployeeType.ADMIN)
          throw new ApiError("Unauthorized", 401);

        if (options?.requireEmployee && decoded.role !== EmployeeType.EMPLOYEE)
          throw new ApiError("Unauthorized", 401);
      }

      return { payload: decoded, token };
    } catch (error) {
      throw new ApiError("Unauthorized", 401);
    }
  };

  static requireNotAuth = async (req: NextApiRequest): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      throw new ApiError("Already logged in", 401);
    }
  };

  static blackListToken = async (token: string): Promise<void> => {
    await prisma.token.updateMany({
      where: { token },
      data: {
        isBlacklisted: true,
      },
    });
  };

  static validateRefreshToken = async (
    token: string,
    options?: { isAdminToken: boolean }
  ): Promise<boolean> => {
    const tokenData = await prisma.token.findFirst({
      where: {
        token,
        type: !options?.isAdminToken
          ? TokenType.REFRESH
          : TokenType.ADMIN_REFRESH,
        isBlacklisted: false,
      },
      select: {
        expiredAt: true,
      },
    });

    if (!tokenData) {
      return false;
    }

    if (tokenData.expiredAt < new Date()) {
      console.log(tokenData.expiredAt, new Date());
      return false;
    }

    return true;
  };

  static validateResetPasswordToken = async (
    token: string
  ): Promise<boolean> => {
    const tokenData = await prisma.token.findFirst({
      where: { token, type: TokenType.RESET_PASSWORD, isBlacklisted: false },
      select: {
        expiredAt: true,
      },
    });

    if (!tokenData) {
      return false;
    }

    if (tokenData.expiredAt < new Date()) {
      return false;
    }

    return true;
  };

  static validatePayInvoiceToken = async (token: string): Promise<boolean> => {
    const tokenData = await prisma.token.findFirst({
      where: { token, type: TokenType.PAY_INVOICE, isBlacklisted: false },
      select: {
        expiredAt: true,
      },
    });

    if (!tokenData) {
      return false;
    }

    if (tokenData.expiredAt < new Date()) {
      return false;
    }

    return true;
  };

  static extendToken = async (token: string, minute: number): Promise<void> => {
    await prisma.token.updateMany({
      where: { token },
      data: {
        expiredAt: new Date(new Date().getTime() + minute * 60000),
      },
    });
  };
}
