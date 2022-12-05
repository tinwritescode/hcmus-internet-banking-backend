import { z } from "zod";
import { ApiError } from "../../../base/baseResponse";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { TokenService } from "../../../server/database/tokenService";

const internalTransferSchema = z.object({
  amount: z.preprocess(BigInt, z.bigint()).refine((amount) => amount > 0),
  to: z.string(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST":
      validateSchema(internalTransferSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const amount = BigInt(req.body.amount);
      const to = req.body.to as string;

      const receiverId = await CustomerService.getCustomerIdByBankNumber(to);

      if (!receiverId) {
        throw new ApiError("Invalid bank number", 400);
      }

      console.log("receiverId", receiverId);

      const result = await CustomerService.transferToAnotherAccount({
        from: id,
        to: receiverId,
        amount,
      });

      res.status(200).json({ data: result });
      break;
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
