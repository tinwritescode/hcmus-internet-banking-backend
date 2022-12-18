import { z } from "zod";
import { catchAsync, validateSchema } from "../../../../core/catchAsync";
import { EmployeeService } from "../../../../lib/database/employeeService";
import { TokenService } from "../../../../lib/database/tokenService";

const getEmployeesSchema = z.object({
  limit: z.preprocess(parseInt, z.number().min(1).max(100).default(10)),
  offset: z.preprocess(parseInt, z.number().min(0).default(0)),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      const { limit, offset } = validateSchema(getEmployeesSchema, req.query);
      await TokenService.requireEmployeeAuth(req, { requireAdmin: true });

      const result = await EmployeeService.getEmployeeLogs({
        limit: limit as number,
        offset: offset as number,
      });

      res.status(200).json({ data: result });
      break;
    }

    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
