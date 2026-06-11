import { INotification} from "../../common/interface";
import { notificationModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class notificationRepository extends DataBaseRepository<INotification>{
    constructor(){
        super(notificationModel)
    }
}