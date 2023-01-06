import { InvoiceService } from '../../../lib/database/invoiceService';
import { z } from 'zod';
import { catchAsync, validateSchema } from '../../../core/catchAsync';
import { CustomerService } from '../../../lib/database/customerService';
import { TokenService } from '../../../lib/database/tokenService';
import { ApiError } from '../../../core/baseResponse';
import { NotificationService } from '../../../lib/notifyService';

const createInvoiceSchema = z.object({
  accountNumber: z
    .string()
    .min(1, { message: 'Account number is shorter than 1 character' }),
  amount: z.preprocess(BigInt, z.bigint()),
  isInternalBank: z
    .preprocess((value) => value === 'true', z.boolean())
    .default(true),
  message: z.string().min(1),
});

const getInvoicesSchema = z.object({
  offset: z
    .preprocess(parseInt, z.number().min(0).default(0).optional())
    .optional(),
  limit: z
    .preprocess(parseInt, z.number().min(1).default(10).optional())
    .optional(),
  isPaid: z.preprocess((value) => value === 'true', z.boolean()).optional(),
  type: z.enum(['created', 'received']).optional(),
});

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case 'POST': {
      validateSchema(createInvoiceSchema, req.body);

      const {
        payload: { id },
      } = await TokenService.requireAuth(req);
      const { accountNumber, amount, isInternalBank, message } =
        createInvoiceSchema.parse(req.body);
      const customer = await CustomerService.getCustomerByBankNumber(
        accountNumber as string
      );

      if (!isInternalBank) {
        throw new ApiError('External bank has note supported yet.', 400);
      } else {
        await CustomerService.getCustomerByBankNumber(accountNumber as string);
        if (id === customer.accountNumber) {
          throw new ApiError("You can't pay to yourself", 400);
        }
      }

      const result = await InvoiceService.createInvoice({
        amount,
        message,
        creator: {
          connect: {
            id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await Promise.all([
        NotificationService.notificationCreateInvoice(result.id),
      ]);

      res.status(200).json({ data: result });
      break;
    }
    case 'GET': {
      const {
        payload: { id },
      } = await TokenService.requireAuth(req);

      const { offset, isPaid, limit, type } = getInvoicesSchema.parse(
        req.query
      );

      const invoices = await InvoiceService.getInvoices({
        creatorId: id,
        offset,
        limit,
        isPaid,
        type,
      });

      res.status(200).json({ data: invoices });
      break;
    }
    default: {
      res.status(405).json({
        error: { message: 'Method not allowed' },
      });
    }
  }
});
