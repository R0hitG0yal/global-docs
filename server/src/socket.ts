import { Socket, Server } from "socket.io";
import Document from "./model/docModel";
import User from "./model/userModel";
import jwt from "jsonwebtoken";
import { IUser } from "./types";

const secret: string = process.env.SECRET + "";
const date = new Date();

const updateDocument = async (id: string, token: string) => {
  const doc = await Document.findById(id);
  if (doc) return doc;
  const defaultValue = "";
  const decoded = jwt.verify(token, secret) as IUser;

  const user = await User.findById(decoded?.id);
  if (user)
    return await Document.create({
      docId: id,
      data: defaultValue,
      createdAt: date,
      userId: user._id,
    });
};

const socket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("createDocument", async (documentId: string, token: string) => {
      const document = await updateDocument(documentId, token);
      socket.join(documentId);
      socket.emit("load-document", document?.data);

      socket.on("send", (delta) => {
        socket.broadcast.to(documentId).emit("receive", delta);
      });

      socket.on("save", async (data) => {
        await Document.findOneAndUpdate(
          {
            docId: documentId,
          },
          { data: data, updatedAt: new Date() }
        );
      });
    });
  });
};

export default socket;
