import { NextApiResponse } from "next";
import { NextApiRequest } from "next";
import { EmployeeService } from "./../../../lib/database/employeeService";

const employeesData = [
  {
    email: "employee36@yopmail.com",
    firstName: "Wednesday",
    lastName: "Addams",
    password: "password",
    employeeType: "ADMIN",
  },
  {
    email: "employee230@yopmail.com",
    firstName: "Thurday",
    lastName: "Addams",
    password: "password",
    employeeType: "EMPLOYEE",
  },
  {
    email: "employee23@yopmail.com",
    firstName: "Wednesday",
    lastName: "Addams",
    password: "password",
    employeeType: "ADMIN",
  },
  {
    email: "employee20@yopmail.com",
    firstName: "Thurday",
    lastName: "Addams",
    password: "password",
    employeeType: "EMPLOYEE",
  },
];

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const env = process.env.NODE_ENV;

  if (env !== "development") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  console.log(`Start seeding ...`);
  for (let i = 0; i < 200; i++) {
    // @ts-ignore
    const user = await EmployeeService.createEmployee({
      ...employeesData[i % employeesData.length],
      email: `test-${Math.random() * 2000 + 10000}@gmail.com`,
    });
    console.log(`Created user with id: ${user.id}`);
  }

  console.log(`Seeding finished.`);

  res.status(200).json({ message: "Seeding finished." });
}
