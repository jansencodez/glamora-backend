import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as orderController from "../controllers/order.controller.js";

const router = express.Router();

router.get("/:orderId", protect("customer"), orderController.getOrderById);
router.put(
  "/:orderId/status",
  protect("admin"),
  orderController.updateOrderStatus
);
router.get("/", protect("admin"), orderController.getAllOrders);

export default router; // Use export default instead of module.exports
