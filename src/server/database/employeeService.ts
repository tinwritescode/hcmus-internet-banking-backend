import { hashPassword } from "./../../lib/bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export class EmployeeService {
  static defaultSelector: Prisma.EmployeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
  };

  static createEmployee = async (employee: Prisma.EmployeeCreateInput) => {
    return await prisma.employee.create({
      data: employee,
    });
  };

  static authenticateEmployee = async (
    email: string,
    password: string
  ): Promise<Prisma.EmployeeGetPayload<{
    select: typeof EmployeeService.defaultSelector;
  }> | null> => {
    const hashedPassword = await hashPassword(password);

    try {
      const employee = await prisma.employee.findFirst({
        where: {
          email: email,
          password: hashedPassword,
        },
        select: EmployeeService.defaultSelector,
      });

      return employee;
    } catch (error) {
      //TODO: Global handle error
      console.log(error);

      return null;
    }
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
}
