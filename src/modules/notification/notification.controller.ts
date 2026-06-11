import { NextFunction, Request, Response, Router } from "express";
import { authintication, authrization } from "../../middleware";
import { notificationServiceModule } from "./notification.service";
import * as validators from "./notification.validation";
import { validation } from "../../middleware/validation.middleware";
import { successResponse } from "../../common/response";
import { endpoints } from "./notification.authrization";
const router = Router();

router.post(
  "/sendOne",
  authintication(),
  validation(validators.sendOneNotificationSchema),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationServiceModule.sendOneNotification(
      req.body,
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

router.post(
  "/sendBulk",
  authintication(),
  validation(validators.sendBulkNotificationsSchema),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationServiceModule.sendBulkNotifications(
      req.body,
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

router.get(
  "/created",
  authintication(),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationServiceModule.getAllNotification(req.user);
    return successResponse({ res, status: 200, result });
  }
);

router.get(
  "/mentioned",
  authintication(),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationServiceModule.getAllMentionsNotifications(
      req.user
    );
    return successResponse({ res, status: 200, result });
  }
);

router.patch(
  "/:notificationId/read",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    await notificationServiceModule.markAsRead(
      req.params.notificationId as string,
      req.user
    );
    return successResponse({
      res,
      status: 200,
      message: "Notification marked as read",
    });
  }
);
router.patch(
  "/:notificationId",
  authintication(),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationServiceModule.updateNotification(
      req.params.notificationId as string,
      req.body,
      req.user
    );

    return successResponse({
      res,
      status: 200,
      result,
    });
  }
);

router.delete(
  "/:notificationId",
  authintication(),
  authrization(endpoints.notification),
  async (req: Request, res: Response, next: NextFunction) => {
    await notificationServiceModule.deleteNotification(
      req.params.notificationId as string,
      req.user
    );
    return successResponse({
      res,
      status: 200,
      message: "Notification deleted successfully",
    });
  }
);
export default router;
