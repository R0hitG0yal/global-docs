import { Router } from "express";
import { userAuth } from "../middleware/auth";
import Document from "../model/docModel";

const docRouter = Router();

docRouter.get("/", userAuth, async (req: any, res) => {
  try {
    const docs = await Document.find({ userId: req.user?.id })
      .select("-data")
      .sort({ updatedAt: -1 });
    if (!docs)
      return res
        .status(404)
        .json({ message: "Document not found", documents: null });
    return res.status(200).json({ message: "Document found", documents: docs });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", err });
  }
});

docRouter.get(":/docId", userAuth, async (req: any, res) => {
  const { docId } = req.params;
  try {
    const docs = await Document.find({ docId }).select("title");
    if (!docs)
      return res
        .status(404)
        .json({ message: "Document not found", documents: null });
    return res.status(200).json({ message: "Document found", documents: docs });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", err });
  }
});

docRouter.put(":/docId", userAuth, async (req: any, res) => {
  const { docId } = req.params;
  let { title } = req.body;
  if (title.trim() === "") title = "New Document";

  try {
    const docs = await Document.findOneAndUpdate({ docId }, { title: title });
    if (!docs)
      return res
        .status(404)
        .json({ message: "Document not found", documents: null });
    return res.status(200).json({ message: "Document found", documents: docs });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", err });
  }
});

docRouter.delete(":/docId", userAuth, async (req: any, res) => {
  const { docId } = req.params;

  try {
    const doc = await Document.findOneAndDelete({ docId });
    if (!doc) {
      return res.status(404).json({ msg: "Document not found!" });
    }
    return res.status(200).json({ msg: "Successfully deleted!" });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error!", error });
  }
});

export default docRouter;
