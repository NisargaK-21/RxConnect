import {Request,Response} from "express";
import authService from "./auth.service";
type SignupType={
  name:string;
  email:string;
  password:string;
  role:string;
  branch_id?:number|null;
};
type LoginType={
  email:string;
  password:string;
}

const signup = async (req:Request, res:Response) => {
  try {
    const userData:SignupType=req.body;
    const result = await authService.signup(userData);

    return res.status(201).json(result);
  } catch (error:any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const login = async (req:Request, res:Response) => {
  try {
    const userData:LoginType=req.body;
    const result = await authService.login(userData);

    return res.status(200).json(result);
  } catch (error:any) {
    return res.status(401).json({
      message: error.message,
    });
  }
};

export default {
  signup,
  login,
};