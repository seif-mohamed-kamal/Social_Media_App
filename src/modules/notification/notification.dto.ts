import {z} from 'zod'
import { sendBulkNotificationsSchema, sendOneNotificationSchema } from './notification.validation'

export type sendOneNotificationDtoBody = z.infer<typeof sendOneNotificationSchema.body>
export type sendBulkNotificationsDtoBody = z.infer<typeof sendBulkNotificationsSchema.body>