import { catchAsync } from "../../../core/catchAsync";
import { TokenService } from "../../../lib/database/tokenService";
import { InterBankService } from "../../../lib/database/interBankService";

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "GET": {
      await TokenService.requireAuth(req);

      const banks = await InterBankService.getInterBanks();
      res.status(200).json({ data: banks });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
