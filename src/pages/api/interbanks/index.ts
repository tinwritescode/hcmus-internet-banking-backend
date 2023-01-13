import { catchAsync, validateSchema } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";
import { InterBankService } from "../../../lib/database/interBankService";
import {
  getKarmaAccountInfoBySoTK,
  postKarmaTransfer,
} from "../../../../src/lib/karma";
// import { z } from "zod";

// const querySchema = z.object({
//   offset: z.coerce.number().default(0),
//   limit: z.coerce.number().default(10),
//   type: z.enum(["sent", "received", "all"]).default("all"),
//   startDate: z.coerce.date().optional(),
//   endDate: z.coerce.date().optional(),
// });

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      //   await TokenService.requireAuth(req);

      const banks = await InterBankService.getInterBanks();
      //   const test = await getKarmaAccountInfoBySoTK({
      //     soTK: "3171918615",
      //     tenNH: "HCMUSBank",
      //   });
      const testTransfer = await postKarmaTransfer({
        soTien: 1234,
        noiDungCK: "test",
        nguoiNhan: "3171918615",
        nguoiChuyen: "3171918615",
      });
      //   console.log("test", test);
      console.log("testTransfer", testTransfer);

      res.status(200).json({ data: banks });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
