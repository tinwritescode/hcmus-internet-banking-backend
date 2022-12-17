import { EmployeeLogType } from "./../../../node_modules/.prisma/client/index.d";
import { comparePassword } from "./../bcrypt";
import { hashPassword } from "../bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { TokenService } from "./tokenService";
import { ApiError } from "../../core/baseResponse";

export class EmployeeService {
  static defaultSelector: Prisma.EmployeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
    employeeType: true,
  };

  static createEmployee = async (employee: Prisma.EmployeeCreateInput) => {
    return await prisma.employee.create({
      data: {
        ...employee,
        password: await hashPassword(employee.password),
      },
    });
  };

  static authenticateEmployee = async (
    email: string,
    password: string
  ): Promise<Prisma.EmployeeGetPayload<{
    select: typeof EmployeeService.defaultSelector;
  }> | null> => {
    const employeeWithPassword = await prisma.employee.findFirstOrThrow({
      where: {
        email: email,
      },
    });

    await comparePassword(password, employeeWithPassword.password).catch(() => {
      return Promise.reject(new ApiError("Invalid email or password", 401));
    });

    return await prisma.employee.findUnique({
      where: {
        email: email,
      },
      select: EmployeeService.defaultSelector,
    });
  };

  static getEmployeeById = async (
    id: string
  ): Promise<Prisma.EmployeeGetPayload<{
    select: typeof EmployeeService.defaultSelector;
  }> | null> => {
    try {
      const employee = await prisma.employee.findUnique({
        where: {
          id: id,
        },
        select: EmployeeService.defaultSelector,
      });

      return employee;
    } catch (error) {
      return null;
    }
  };

  static getEmployeeByEmail = async (
    email: string
  ): Promise<Prisma.EmployeeGetPayload<{
    select: typeof EmployeeService.defaultSelector;
  }> | null> => {
    try {
      const employee = await prisma.employee.findUnique({
        where: {
          email: email,
        },
        select: EmployeeService.defaultSelector,
      });

      return employee;
    } catch (error) {
      return null;
    }
  };

  static getEmployeeByRefreshToken = async (refreshToken: string) => {
    const token = await TokenService.getToken(refreshToken);

    if (!token) {
      throw new ApiError("Invalid token", 401);
    }

    return await EmployeeService.getEmployeeById(token.employeeId);
  };

  static getAllEmployees(options: { offset?: number; limit?: number }): Promise<
    Prisma.EmployeeGetPayload<{
      select: typeof EmployeeService.defaultSelector;
    }>[]
  > {
    return prisma.employee.findMany({
      skip: options.offset,
      take: options.limit,
      select: EmployeeService.defaultSelector,
    });
  }

  static writeLog = async ({
    employeeId,
    log,
    type,
  }: {
    employeeId: string;
    log: string;
    type: EmployeeLogType;
  }) => {
    await prisma.employeeLog.create({
      data: {
        employeeId,
        data: log,
        deletedAt: null,
        type,
      },
    });
  };

  static async updateEmployee({
    email,
    employeeType,
    firstName,
    lastName,
    password,
    id,
  }: {
    id: string;
    email: string;
    employeeType: "ADMIN" | "EMPLOYEE";
    firstName: string;
    lastName: string;
    password: string;
  }) {
    return prisma.employee.update({
      where: {
        id,
      },
      data: {
        email,
        employeeType,
        firstName,
        lastName,
        password: await hashPassword(password),
      },
    });
  }

  static async deleteEmployee(id: string) {
    return prisma.employee.delete({
      where: {
        id,
      },
    });
  }
}
