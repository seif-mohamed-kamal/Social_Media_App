import { z } from "zod";
import { generalValidationFeilds } from "../../common/validation";

export const sendOneNotificationSchema = {
  body: z.strictObject({
    content: z.string().min(2),
    title: z.string().min(2),
    sendTo: generalValidationFeilds.id,
  }),
};

export const sendBulkNotificationsSchema = {
    body: z.strictObject({
      content: z.string().min(2),
      title: z.string().min(2),
      receiverId: z.array(z.string()).min(1),
    }),
  };
  
  
