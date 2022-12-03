import { RecipientService } from "./../../../server/database/recipientService";
import { setCookie } from "nookies";
import { z } from "zod";
import { catchAsync, validateSchema } from "../../../base/catchAsync";
import { CustomerService } from "../../../server/database/customerService";
import {
  TokenService,
  COOKIES_TOKEN_NAME,
} from "../../../server/database/tokenService";

const getAllRecipientsSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case "POST": {
      //   validateSchema(loginValidate, req.body);
      const { id } = await TokenService.requireAuth(req);

      const { accountNumber, mnemonicName } = req.body;
      const result = await RecipientService.createRecipient({
        accountNumber,
        mnemonicName,
        CustomerRecipient: {
          connectOrCreate: {
            where: {
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
      const { id } = await TokenService.requireAuth(req);

      const { offset, limit } = req.query;
      validateSchema(getAllRecipientsSchema, req.query);
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
