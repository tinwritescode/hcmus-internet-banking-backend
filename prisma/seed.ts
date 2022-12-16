import { EmployeeService } from "../src/lib/database/employeeService";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const employeesData: Prisma.EmployeeCreateInput[] = [
  {
    email: "employee1@yopmail.com",
    firstName: "Wednesday",
    lastName: "Addams",
    password: "password",
    employeeType: "ADMIN",
  },
  {
    email: "employee2@yopmail.com",
    firstName: "Thurday",
    lastName: "Addams",
    password: "password",
    employeeType: "EMPLOYEE",
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of employeesData) {
    const user = await EmployeeService.createEmployee(u);
    console.log(`Created user with id: ${user.id}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
