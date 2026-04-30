import { IPost } from "../../common/interface";
import { postModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class postRepository extends DataBaseRepository<IPost>{
    constructor(){
        super(postModel)
    }
}