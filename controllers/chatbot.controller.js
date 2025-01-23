import Product from "../models/Product.js";
import { OrderDetails } from "../models/Order.js";
import NodeCache from "node-cache";
import Fuse from "fuse.js";

// Cache initialization with 10-minute expiry
const cache = new NodeCache({ stdTTL: 600 });

// Simple intent patterns using regular expressions
const intentPatterns = {
  greeting: /^(hello|hi|hey|how are you)/i,
  product_info: /(tell me about|what is|where can I buy)/i,
  order_status: /(order status|track.*order)/i,
  product_recommendation: /(suggest|recommend|best product)/i,
  skin_type: /(dry skin|oily skin|sensitive skin)/i,
  season: /(winter|summer) skincare/i,
  occasion: /(wedding|office) makeup/i,
  return_policy: /(return policy|can.*return)/i,
  delivery_time: /(when.*arrive|shipping time)/i,
  feedback: /(complaint|feedback)/i,
};

// Session management
const sessionStore = new Map();

function getContext(sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      history: [],
      preferences: [],
      lastIntent: null,
    });
  }
  return sessionStore.get(sessionId);
}

function updateContext(sessionId, intent, userQuery) {
  const context = getContext(sessionId);
  context.history.push({ intent, query: userQuery });
  context.lastIntent = intent;
}

// Determine intent based on regex patterns
function determineIntent(input) {
  for (const [intent, pattern] of Object.entries(intentPatterns)) {
    if (pattern.test(input)) {
      return intent;
    }
  }
  return "general_query";
}

// Main chatbot function
export const chatBot = async (req, res) => {
  try {
    const { input, sessionId } = req.body;
    const context = getContext(sessionId);
    const intent = determineIntent(input);
    const response = await generateResponse(input, intent, sessionId, context);
    res.json({ response });
  } catch (error) {
    console.error("Error in chatbot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Generate response based on intent
async function generateResponse(input, intent, sessionId, context) {
  const handlers = {
    greeting: getGreetingResponse,
    product_info: () => getProductInfo(input),
    product_recommendation: () => getProductRecommendations(sessionId, input),
    skin_type: () => getSkinTypeRecommendations(input),
    season: () => getSeasonalRecommendations(input),
    occasion: () => getOccasionRecommendations(input),
    return_policy: () =>
      "Our return policy allows returns within 30 days of purchase. Do you need help with a return?",
    delivery_time: () =>
      "Orders typically arrive within 3-5 business days. Is there a specific order you'd like to track?",
    feedback: () =>
      "Thank you for your feedback! We value your input and will use it to improve.",
    order_status: () => getOrderStatus(input),
  };

  const response = handlers[intent]
    ? await handlers[intent]()
    : "I'm not sure how to help with that. Could you rephrase your question?";

  updateContext(sessionId, intent, input);
  return response;
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

async function getGreetingResponse() {
  const greetings = {
    morning: [
      "Good morning! Ready to explore beauty? 🌞",
      "Rise and shine with some beauty! 🌼",
    ],
    afternoon: [
      "Good afternoon! How about a beauty break? 💄",
      "Afternoon! Let's explore beauty! 🌸",
    ],
    evening: [
      "Good evening! Ready to pamper yourself? ✨",
      "Evening! Discover beauty essentials! 🌙",
    ],
    general: ["Hello! How can I assist you with beauty products today?"],
  };

  const timeOfDay = getTimeOfDay();
  const options = greetings[timeOfDay] || greetings.general;
  return options[Math.floor(Math.random() * options.length)];
}

async function getProductInfo(input) {
  try {
    const cacheKey = `product_info_${input.toLowerCase()}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Create a text index if it doesn't exist (this should be done at schema level)
    await Product.collection.createIndex({
      name: "text",
      description: "text",
      category: "text",
    });

    // First try exact text search
    let product = await Product.findOne(
      { $text: { $search: input } },
      {
        score: { $meta: "textScore" },
        name: 1,
        description: 1,
        category: 1,
        price: 1,
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .lean();

    // If no results with text search, try partial matching
    if (!product) {
      product = await Product.findOne({
        $or: [
          { name: { $regex: input, $options: "i" } },
          { description: { $regex: input, $options: "i" } },
          { category: { $regex: input, $options: "i" } },
        ],
      }).lean();
    }

    if (product) {
      const response = `The product "${product.name}" costs Ksh ${product.price}. ${product.description}`;
      cache.set(cacheKey, response);
      return response;
    }

    return `I couldn't find any product matching "${input}". Please try rephrasing.`;
  } catch (error) {
    console.error("Error fetching product info:", error);
    return "There was an error fetching product details. Please try again.";
  }
}

async function getProductRecommendations(sessionId, input) {
  try {
    const context = getContext(sessionId);
    const preferences = context.preferences || [];
    let recommendations;

    const priceMatch = {
      affordable: /cheap|affordable|low cost|budget/i,
      premium: /expensive|premium|high-end|luxury/i,
    };

    const cacheKey =
      Object.entries(priceMatch).find(([_, pattern]) =>
        pattern.test(input)
      )?.[0] || "top_rated";

    recommendations = cache.get(`${cacheKey}_products`);

    if (!recommendations) {
      const query = {};
      const sort =
        cacheKey === "affordable"
          ? { price: 1 }
          : cacheKey === "premium"
          ? { price: -1 }
          : { rating: -1 };

      recommendations = await Product.find(query).sort(sort).limit(10).lean();

      cache.set(`${cacheKey}_products`, recommendations);
    }

    const personalized = recommendations.filter((product) =>
      preferences.includes(product.category)
    );

    const finalRecommendations = personalized.length
      ? personalized
      : recommendations;

    return formatRecommendations(
      finalRecommendations,
      cacheKey,
      personalized.length > 0
    );
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return "There was an error fetching product recommendations. Please try again.";
  }
}

function formatRecommendations(products, type, isPersonalized) {
  const header = isPersonalized
    ? "Top products for you based on your preferences:"
    : `Here are some ${
        type === "affordable"
          ? "affordable"
          : type === "premium"
          ? "premium"
          : "top-rated"
      } product recommendations:`;

  const productList = products
    .map(
      (product) =>
        `${product.name} - Ksh${Number(product.price).toFixed(2)} ` +
        `(${product.rating || "N/A"} stars)`
    )
    .join("\n");

  return `${header}\n${productList}`;
}

// Search through products based on input for skin type, season, or occasion
async function searchProducts(query) {
  try {
    // Create a text index if it doesn't exist (this should be done at schema level)
    await Product.collection.createIndex({
      name: "text",
      description: "text",
      category: "text",
    });

    // Use MongoDB's $text search with $meta for relevance scoring
    const results = await Product.find(
      { $text: { $search: query } },
      {
        score: { $meta: "textScore" },
        name: 1,
        description: 1,
        category: 1,
        price: 1,
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

    // If no results with text search, try partial matching
    if (results.length === 0) {
      return await Product.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
        ],
      })
        .limit(10)
        .lean();
    }

    return results;
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

// Skin type recommendations
async function getSkinTypeRecommendations(input) {
  const skinTypes = ["dry skin", "oily skin", "sensitive skin"];
  const matchedSkinType = skinTypes.find((type) =>
    input.toLowerCase().includes(type)
  );

  if (!matchedSkinType) {
    return "Please specify your skin type for better recommendations.";
  }

  const products = await searchProducts(matchedSkinType);
  if (products.length) {
    return `Here are some products for ${matchedSkinType}:\n${products
      .map((product) => `${product.name} - Ksh${product.price}`)
      .join("\n")}`;
  } else {
    return `No products found for ${matchedSkinType}. Try rephrasing.`;
  }
}

// Seasonal recommendations
async function getSeasonalRecommendations(input) {
  const currentSeason = getCurrentSeason();
  const products = await searchProducts(currentSeason);

  if (products.length) {
    return `Based on the current season, here are some seasonal skincare recommendations for you:\n${products
      .map((product) => `${product.name} - Ksh${product.price}`)
      .join("\n")}`;
  } else {
    return `No seasonal products found. Let me know if you'd like something else.`;
  }
}

// Occasion-based recommendations
async function getOccasionRecommendations(input) {
  const occasions = ["wedding", "office", "party", "casual"];
  const matchedOccasion = occasions.find((occasion) =>
    input.toLowerCase().includes(occasion)
  );

  if (!matchedOccasion) {
    return "Please specify the occasion you're looking for recommendations for.";
  }

  const products = await searchProducts(matchedOccasion);
  if (products.length) {
    return `Here are some products for your ${matchedOccasion}:\n${products
      .map((product) => `${product.name} - Ksh${product.price}`)
      .join("\n")}`;
  } else {
    return `No products found for ${matchedOccasion}. Try rephrasing.`;
  }
}

// Utility function to determine the current season
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // Get current month (1-12)
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

async function getOrderStatus(input) {
  try {
    // Extract the orderId from the input
    const orderId = input.match(
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
    )?.[0];
    if (!orderId)
      return "Please provide a valid order ID in the correct format.";

    // Query the database for the order
    const order = await OrderDetails.findOne({ orderId }).lean();
    if (!order) {
      return `Order #${orderId} not found. Please double-check the ID.`;
    }

    // Construct the response
    const deliveryDate = new Date(
      order.shipping.deliveryDate
    ).toLocaleDateString();
    const itemSummary = order.items
      .map((item) => `${item.name} (x${item.quantity})`)
      .join(", ");
    const paymentStatus = order.payment?.status || "N/A";

    return `Order #${orderId} Status:
    - Status: ${order.status}
    - Items: ${itemSummary}
    - Total Price: Ksh${order.totalPrice.toFixed(2)}
    - Discount Applied: Ksh${order.discountApplied.toFixed(2)}
    - Final Price: Ksh${order.finalPrice.toFixed(2)}
    - Payment Status: ${paymentStatus}
    - Delivery Date: ${deliveryDate}`;
  } catch (error) {
    console.error("Error fetching order status:", error);
    return "There was an error retrieving the order details. Please try again later.";
  }
}
