import { EmployeeLogType } from "./../../../node_modules/.prisma/client/index.d";
import { comparePassword } from "./../bcrypt";
import { hashPassword } from "../bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { TokenService } from "./tokenService";
import { ApiError, PagingResponse } from "../../core/baseResponse";

export class EmployeeService {
  static defaultSelector: Prisma.EmployeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
    employeeType: true,
    email: true,
    createdAt: true,
    updatedAt: true,
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

  static async getAllEmployees(options: {
    offset?: number;
    limit?: number;
    where?: Prisma.EmployeeWhereInput;
  }): Promise<PagingResponse> {
    const { offset = 0, limit = 10, where } = options;
    // with count all
    const employees = await prisma.employee.findMany({
      skip: offset,
      take: limit,
      select: EmployeeService.defaultSelector,
      where: where,
    });

    const total = await prisma.employee.count();

    const result: PagingResponse = {
      data: employees,
      metadata: {
        total: total,
        page: offset / limit + 1,
        limit: limit,
        hasNextPage: offset + limit < total,
        hasPrevPage: offset > 0,
      },
    };

    return result;
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
    email?: string;
    employeeType?: "ADMIN" | "EMPLOYEE";
    firstName?: string;
    lastName?: string;
    password?: string;
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
        password: password ? await hashPassword(password) : undefined,
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

  static async getEmployeeLogs({
    limit,
    offset,
    where,
  }: {
    offset: number;
    limit: number;
    where?: Prisma.EmployeeLogWhereInput;
  }): Promise<PagingResponse> {
    const logs = await prisma.employeeLog.findMany({
      where: {
        ...where,
      },
      select: {
        id: true,
        data: true,
        type: true,
        createdAt: true,
      },
      skip: offset,
      take: limit,
    });

    const result: PagingResponse = {
      data: logs,
      metadata: {
        total: logs.length,
        page: offset / limit + 1,
        limit: limit,
        hasNextPage: offset + limit < logs.length,
        hasPrevPage: offset > 0,
      },
    };

    return result;
  }
}
