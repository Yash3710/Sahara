import { getUserDocuments, saveDocumentMeta, updateDocumentMeta, deleteDocumentMeta, getDocumentById } from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function listDocuments(req, res) {
  try {
    const category = req.query.category || null;
    const docs = await getUserDocuments(req.userId, category);
    return sendSuccess(res, docs, "Documents retrieved");
  } catch (err) {
    return sendError(res, "Could not load your documents. Please try again.", 500);
  }
}

export async function createDocument(req, res) {
  try {
    const { name, category, file_name, file_size, mime_type, storage_path, notes } = req.body;
    if (!name || !file_name || !storage_path) {
      return sendError(res, "Please provide a document name and file.", 400);
    }
    const doc = await saveDocumentMeta(req.userId, {
      name,
      category: category || 'other',
      file_name,
      file_size: file_size || 0,
      mime_type: mime_type || 'application/octet-stream',
      storage_path,
      notes: notes || null,
    });
    return sendSuccess(res, doc, "Document saved successfully", 201);
  } catch (err) {
    return sendError(res, "Could not save your document. Please try again.", 500);
  }
}

export async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const { name, category, notes } = req.body;
    const data = {};
    if (name) data.name = name;
    if (category) data.category = category;
    if (notes !== undefined) data.notes = notes;
    if (Object.keys(data).length === 0) {
      return sendError(res, "Please provide at least one field to update.", 400);
    }
    const result = await updateDocumentMeta(req.userId, id, data);
    return sendSuccess(res, result, "Document updated");
  } catch (err) {
    return sendError(res, "Could not update your document. Please try again.", 500);
  }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    await deleteDocumentMeta(req.userId, id);
    return sendSuccess(res, null, "Document deleted");
  } catch (err) {
    return sendError(res, "Could not delete your document. Please try again.", 500);
  }
}
