import { defaultCustomerSelector } from "./customerService";
import { ApiError } from "../../core/baseResponse";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export class LogService {
  static defaultSelector: Prisma.LogSelect = {
    id: true,
    createdAt: true,
    customer: { select: defaultCustomerSelector },
    customerId: true,
    data: true,
    type: true,
    updatedAt: true,
  };

  static createLog = async (log: Prisma.LogCreateInput) => {
    try {
      return await prisma.log.create({
        data: log,
      });
    } catch (error) {
      // P2002
      if (error.code === "P2002") {
        throw new ApiError("Invalid log", 400);
      }

      throw new ApiError("Something went wrong", 500);
    }
  };
}
