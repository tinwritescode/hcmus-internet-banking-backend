import { Prisma, TokenType } from "@prisma/client";
import { randomUUID } from "crypto";
import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";

const defaultTokenSelector: Prisma.TokenSelect = {
  id: true,
  token: true,
  expiredAt: true,
};

export type DefaultTokenSelector = Prisma.TokenGetPayload<{
  select: typeof defaultTokenSelector;
}>;

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
}
