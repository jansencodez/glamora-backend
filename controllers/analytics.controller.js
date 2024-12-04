// controllers/analyticsController.js
import { OrderDetails } from "../models/Order.js";

export const getAnalytics = async (req, res) => {
  try {
    const topLimit = parseInt(req.query.top || "5");

    // Sales Overview: Separate sums for pending delivery and delivered orders
    const salesOverview = await OrderDetails.aggregate([
      {
        $match: { status: { $in: ["delivered", "pending delivery"] } }, // Match both delivered and pending delivery orders
      },
      {
        $group: {
          _id: "$status", // Group by status (delivered or pending delivery)
          total: { $sum: { $toDouble: "$finalPrice" } },
        },
      },
    ]);

    const salesData = {
      totalSales: 0,
      pendingDeliverySales: 0,
      deliveredSales: 0,
    };

    // Calculate totals for each status (pending delivery, delivered)
    salesOverview.forEach((item) => {
      if (item._id === "pending delivery") {
        salesData.pendingDeliverySales = item.total;
      } else if (item._id === "delivered") {
        salesData.deliveredSales = item.total;
      }
    });

    salesData.totalSales =
      salesData.pendingDeliverySales + salesData.deliveredSales;

    // Order Status Counts: Count for each relevant status
    const orderStatuses = await OrderDetails.aggregate([
      {
        $match: {
          status: {
            $in: [
              "pending delivery",
              "payment pending",
              "delivered",
              "canceled",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const orderStatusCount = orderStatuses.reduce(
      (acc, status) => {
        acc[status._id] = status.count;
        return acc;
      },
      {
        "pending delivery": 0,
        "payment pending": 0,
        delivered: 0,
        canceled: 0,
      }
    );

    // Top Products: Group by productId and sum up total sales for each product
    const topProducts = await OrderDetails.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSales: { $sum: { $toDouble: "$items.price" } },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: topLimit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] },
        },
      },
    ]);

    res.json({
      salesOverview: salesData, // Return the sales data for all statuses
      orderStatusCount,
      topProducts: topProducts.map((product) => ({
        id: product._id,
        name: product.productDetails?.name,
        totalSales: product.totalSales,
        imageUrls: product.productDetails?.imageUrls,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error.message);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
