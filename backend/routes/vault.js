import { Router } from "express";
import { listDocuments, createDocument, updateDocument, deleteDocument } from "../controllers/vaultController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, listDocuments);
router.post("/", verifyToken, createDocument);
router.put("/:id", verifyToken, updateDocument);
router.delete("/:id", verifyToken, deleteDocument);

export default router;
