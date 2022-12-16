import { RecipientService } from "./../../../server/database/recipientService";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import { TokenService } from "../../../server/database/tokenService";

const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
  newPassword: z
    .string()
    .min(1, { message: "Account number is shorter than 1 character" }),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      validateSchema(changePasswordSchema, req.body);
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { accountNumber } = req.body;
      const mnemonicName = req.body.mnemonicName;

      const isInternalBank = req.body.isInternalBank || true;

      if (isInternalBank) {
        await CustomerService.getCustomerByBankNumber(accountNumber as string);
      } else {
        throw new Error("External bank not supported");
      }

      const result = await RecipientService.createRecipient({
        accountNumber,
        mnemonicName,
        internalBankCustomer: {
          connect: {
            id,
          },
        },
        customerRecipient: {
          connectOrCreate: {
            where: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              customerId_recipientId: {
                customerId: id,
                recipientId: accountNumber,
              },
            },
            create: {
              customerId: id,
            },
          },
        },
      });

      res.status(200).json({ data: result });
      break;
    }
    case "GET": {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { offset, limit } = req.query;
      const recipients = await RecipientService.getRecipientsByCustomerId(
        id,
        parseInt((offset as string) || "0"),
        parseInt((limit as string) || "10")
      );

      res.status(200).json({ data: recipients });
      break;
    }
    default:
      res.status(405).json({
        error: { message: "Method not allowed" },
      });
  }
});
