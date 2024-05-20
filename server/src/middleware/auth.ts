import jwt from "jsonwebtoken";
import { IUser } from "../types";
import { Response, NextFunction } from "express";
import User from "../model/userModel";

const secret = process.env.SECRET + "";

export const userAuth = async (req: any, res: Response, next: NextFunction) => {
  const token = req?.headers["authorization"];
  if (!token)
    return res
      .status(401)
      .json({ message: "token missing", token: false, valid: false });

  try {
    const decoded = jwt.verify(token, secret) as IUser;
    const user = await User.findById(decoded?.id);
    if (!user)
      return res
        .status(401)
        .json({ message: "User not found", token: false, valid: false });
    req.user = user || undefined;
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "InternalServerError", token: false, valid: false });
  }
};
