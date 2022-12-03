import { parseCookies } from "nookies";
import { ApiError } from "./../../base/baseResponse";
import { Prisma, TokenType } from "@prisma/client";
import { randomUUID } from "crypto";
import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";
import { NextApiRequest } from "next";

const defaultTokenSelector: Prisma.TokenSelect = {
  id: true,
  token: true,
  expiredAt: true,
};

export type DefaultTokenSelector = Prisma.TokenGetPayload<{
  select: typeof defaultTokenSelector;
}>;

export const COOKIES_TOKEN_NAME = "accessToken";

export class TokenService {
  static generateToken = async (
    type: TokenType,
    expiredAt: Date
  ): Promise<DefaultTokenSelector | null> => {
    try {
      const token = await prisma.token.create({
        data: {
          type,
          expiredAt,
          token: randomUUID(),
        },
        select: defaultTokenSelector,
      });

      return token;
    } catch (error) {
      throw new Error(error);
    }
  };

  static generateAccessToken = async (
    payload: any,
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
      select: defaultTokenSelector,
    });

    return tokenData;
  };

  static validateAccessToken = async (token: string): Promise<any> => {
    const secret = process.env.JWT_SECRET
      ? process.env.JWT_SECRET
      : "xinchaocacbanlailachaod4y";

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        }

        resolve(decoded);
      });
    });
  };

  static requireAuth = async <T>(req: NextApiRequest): Promise<string> => {
    const token = req.cookies["token"];

    if (!token) {
      throw new ApiError("Unauthorized", 401);
    }

    try {
      const decoded = await TokenService.validateAccessToken(token);

      return decoded;
    } catch (error) {
      throw new ApiError("Unauthorized", 401);
    }
  };

  static requireNotAuth = async <T>(req: NextApiRequest): Promise<void> => {
    const token = parseCookies({ req })[COOKIES_TOKEN_NAME];

    if (token) {
      throw new ApiError("Already logged in", 401);
    }
  };
}
