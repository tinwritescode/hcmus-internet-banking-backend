import { ApiError } from "../../core/baseResponse";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import moment from "moment";

export class InterBankService {
  static defaultSelector: Prisma.BankSelect = {
    id: true,
    name: true,
    address: true,
  };

  static getInterBanks = async () => {
    try {
      return await prisma.bank.findMany({
        select: InterBankService.defaultSelector,
      });
    } catch (error) {
      throw new ApiError("Something went wrong", 500);
    }
  };
}
