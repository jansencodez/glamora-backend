const express = require("express");
const router = express.Router();
const upload = require("../utils/upload");

const productsController = require("../controllers/products.controller");

router.get("/", productsController.getAllProducts);
router.get("/:id", productsController.getProductById);
router.post("/", upload, productsController.createProduct);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);
router.post("/bulk", upload, productsController.bulkUploadProducts);
module.exports = router;
