import { Request, Response, Router } from "express";
import User from "../model/userModel";
import { IUser } from "../types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userAuth } from "../middleware/auth";
import nodemailer from "nodemailer";

const secret = process.env.SECRET || "";
const frontend = process.env.CLIENT_URL;
const serverEmail = process.env.SERVER_EMAIL;
const password = process.env.SERVER_PASSWORD;
const userRouter = Router();

// For setting req.user as user, otherwise ts shows error as it can of any type
interface RequestWithUser extends Request {
  user?: IUser;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: serverEmail,
    pass: password,
  },
});

// /user -> Fetch user details using the token
userRouter
  .route("/")
  .get(userAuth, async (req: RequestWithUser, res: Response) => {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ msg: "Invalid Request!" });
    }
    try {
      const user = await User.findById(req.user._id).select("-passwd");
      if (!user) {
        return res.status(404).json({ msg: "User not found!", user: null });
      }
      return res.status(200).json({ msg: "User Found!", user });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error", error });
    }
  })
  .put(userAuth, async (req: RequestWithUser, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(400).json({ msg: "Invalid Request!" });
      }

      let { email, name, passwd } = req.body;

      if (!email || !name) {
        return res
          .status(400)
          .json({ msg: "Invalid inputs. Email and name required!" });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ msg: "Can't find user!" });
      }
      
      if (!user._id == (req.user.id)) {
        return res.status(403).json({ msg: "Unauthorized Request!" });
      }

      if (passwd !== "") {
        passwd = await bcrypt.hash(passwd, 10);
      }

      const update = await User.findOneAndUpdate(
        { _id: user._id },
        { email, name, ...(passwd !== "" && { passwd }) },
        { new: true }
      );

      if (!update) {
        return res
          .status(400)
          .json({ msg: "Error while updating the user details!" });
      }

      return res.status(200).json({ msg: "User details updated!" });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  });

// /user/:userId -> Fetch user details for that userId
userRouter.route("/:userId").get(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ msg: "Invalid Request!" });
  }
  try {
    const user = await User.findById(userId).select("-passwd");
    if (user) {
      return res
        .status(200)
        .json({ msg: "User details fetched successfully!", user: user });
    } else {
      return res.status(400).json({ msg: "User not found!" });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

// /user/signup -> For new account/signup
userRouter.route("/signup").post(async (req, res) => {
  const { name, email, passwd } = req.body;
  if (!email || !name || !passwd) {
    return res.status(400).json({ msg: "Details not provided!" });
  }
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(401).json({ msg: "User already exists!" });
    }
    const hashedPasswd = await bcrypt.hash(passwd, 10);
    const newUser = new User({
      name: name,
      email: email,
      passwd: hashedPasswd,
    });
    await newUser.save();
    return res
      .status(200)
      .json({ msg: "User signed up successfully!", user: newUser });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

// /user/login -> Login using email and passwd
userRouter.route("/login").post(async (req, res) => {
  const { email, passwd } = req.body;
  if (!email || !passwd) {
    return res
      .status(400)
      .json({ msg: "Email or password missing", token: null });
  }
  try {
    const user: IUser | null = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ msg: "User not found!", token: null });
    }
    const isValid = await bcrypt.compare(passwd, user.passwd);
    if (!isValid) {
      return res.status(401).json({ msg: "Incorrect password", token: null });
    }
    const token = jwt.sign({ id: user._id }, secret);
    return res.status(200).json({ msg: "Login successful", token: token });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

// /user/forgotpass -> Send email instructions to reset user pass
userRouter.route("/forgotpass").post(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ msg: "User not found! Please check your email" });
  }
  const token = jwt.sign({ id: user._id }, secret, { expiresIn: "10m" });
  const resetLink = frontend + "/resetpass?token=" + token;

  const mailOptions = {
    from: serverEmail,
    to: email,
    subject: "Reset your Account Password - MB Docs!",
    html: `<html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-top: 1px solid #dddddd;
                    }
                    h1 {
                        color: #333333;
                    }
                    p {
                        color: #555555;
                    }
                    a {
                        color: #007BFF;
                        text-decoration: none;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #dddddd;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>MB Docs</h1>
                    <p>To reset your account password, click <a href="${resetLink}">here</a>.</p>
                    <p>Note: The link is only valid for 10 minutes.</p>
                </div>
                <div class="container footer">
                    <p>&copy; 2023 MB Docs. All rights reserved.</p>
                </div>
            </body>
        </html>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset email sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending reset email." });
  }
});

// /user/reset -> Reset user passwd
userRouter.route("/reset").put(async (req, res) => {
  const { passwd, userToken: token } = req.body;
  if (!token) {
    return res.status(401).json({ msg: "Token Missing" });
  }

  try {
    const decoded = jwt.verify(token, secret) as IUser;
    const hashedPasswd = await bcrypt.hash(passwd, 10);
    const user = await User.findByIdAndUpdate(decoded?.id, {
      passwd: hashedPasswd,
    });

    if (!user) {
      return res.status(404).json({ msg: "Token is invalid!" });
    }
    return res.status(200).json({ msg: "Password Reset Successful!" });
  } catch (error) {
    return res.status(400).json({ msg: "Token is either invalid or expired!" });
  }
});

export default userRouter;
