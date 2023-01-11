import { catchAsync } from '../../../core/catchAsync';
import { NotificationService } from '../../../lib/database/notifyService';
import { TokenService } from '../../../lib/database/tokenService';

export default catchAsync(async function handle(req, res) {
  switch (req.method) {
    case 'GET': {
      try {
        const {
          payload: { id },
        } = await TokenService.requireAuth(req);
        const { offset, limit } = req.query;
        const notifications = await NotificationService.getNotifications(
          id as string,
          parseInt((offset as string) || '0'),
          parseInt((limit as string) || '10')
        );

        res.status(200).json({
          data: notifications,
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }

      break;
    }
    default:
      res.status(405).json({
        error: { message: 'Method not allowed' },
      });
  }
});
