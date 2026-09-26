import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../controllers/remindersController.js";

const router = Router();

router.use(verifyToken);

router.get("/", listReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

router.post("/appointments", createAppointment);
router.put("/appointments/:id", updateAppointment);
router.delete("/appointments/:id", deleteAppointment);

export default router;
