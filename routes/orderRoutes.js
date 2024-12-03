const express = require("express");
const orderController = require("../controllers/order.controller");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/:orderId", protect("customer"), orderController.getOrderById);
router.put(
  "/:orderId/status",
  protect("admin"),
  orderController.updateOrderStatus
);
router.get("/", protect("admin"), orderController.getAllOrders);

module.exports = router;
