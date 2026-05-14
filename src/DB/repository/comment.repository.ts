import { IComment} from "../../common/interface";
import { commentModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class commentRepository extends DataBaseRepository<IComment>{
    constructor(){
        super(commentModel)
    }
}