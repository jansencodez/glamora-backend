import Product from "../models/Product.js";
import { OrderDetails } from "../models/Order.js";
import natural from "natural";
import NodeCache from "node-cache";
import Fuse from "fuse.js";

// NLP Initialization
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const classifier = new natural.BayesClassifier();
const cache = new NodeCache({ stdTTL: 600 }); // Cache with 10-minute expiry

// Train the NLP Classifier
const intents = [
  { phrases: ["hello", "hi", "hey", "how are you?"], intent: "greeting" },
  {
    phrases: ["tell me about", "what is", "where can I buy"],
    intent: "product_info",
  },
  { phrases: ["order status", "track my order"], intent: "order_status" },
  {
    phrases: ["suggest a product", "recommend", "best product"],
    intent: "product_recommendation",
  },
  { phrases: ["dry skin", "oily skin", "sensitive skin"], intent: "skin_type" },
  { phrases: ["winter skincare", "summer skincare"], intent: "season" },
  { phrases: ["wedding makeup", "office makeup"], intent: "occasion" },
  {
    phrases: ["return policy", "Can I return an item?"],
    intent: "return_policy",
  },
  {
    phrases: ["When will my order arrive?", "shipping time"],
    intent: "delivery_time",
  },
  { phrases: ["complaint", "feedback"], intent: "feedback" },
];

intents.forEach(({ phrases, intent }) => {
  phrases.forEach((phrase) => classifier.addDocument(phrase, intent));
});
classifier.train();

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

// Utility Functions
function extractKeywords(
  input,
  commonWords = ["the", "is", "about", "of", "a", "an"]
) {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !commonWords.includes(word));
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

// Main Chatbot Function
export const chatBot = async (req, res) => {
  try {
    const { input, sessionId } = req.body;
    const context = getContext(sessionId);
    const intent = classifier.classify(input.toLowerCase()) || "general_query";
    const response = await generateResponse(
      preprocessInput(input),
      intent,
      sessionId,
      context
    );
    res.json({ response });
  } catch (error) {
    console.error("Error in chatbot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function preprocessInput(input) {
  const tokens = tokenizer.tokenize(input.toLowerCase());
  return tokens.map((word) => stemmer.stem(word));
}

// Generate Response Based on Intent
async function generateResponse(input, intent, sessionId, context) {
  let followUpResponse = "";
  if (context.lastIntent === "product_info" && intent === "order_status") {
    followUpResponse = `I remember you asked about a product. Do you want to track your order for that product?`;
  }

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
    : "I'm not sure how to help with that.";
  updateContext(sessionId, intent, input); // Update context after response
  return followUpResponse || response;
}

// Specific Intent Handlers
async function getGreetingResponse() {
  const greetings = {
    morning: [
      "Good morning! Ready to explore beauty? 🌞",
      "Rise and shine with some beauty! 🌼",
    ],
    afternoon: [
      "Good afternoon! How about a beauty break? 💄",
      "Afternoon! Let’s explore beauty! 🌸",
    ],
    evening: [
      "Good evening! Ready to pamper yourself? ✨",
      "Evening! Discover beauty essentials! 🌙",
    ],
    general: ["Hello! How can I assist you with beauty products today?"],
  };

  const timeOfDay = getTimeOfDay();
  const randomGreeting =
    greetings[timeOfDay][
      Math.floor(Math.random() * greetings[timeOfDay].length)
    ];
  return randomGreeting;
}

async function getProductInfo(input) {
  try {
    const allProducts = await Product.find(
      {},
      { name: 1, description: 1, category: 1 }
    );
    const fuse = new Fuse(allProducts, {
      keys: ["name", "description", "category"],
      threshold: 0.3,
    });
    const results = fuse.search(input);

    if (results.length > 0) {
      const topMatch = results[0].item;
      return `The product "${topMatch.name}" costs Ksh ${topMatch.price}. ${topMatch.description}`;
    } else {
      return `I couldn't find any product matching "${input}". Please try rephrasing.`;
    }
  } catch (error) {
    console.error("Error fetching product info:", error);
    return "There was an error fetching product details. Please try again.";
  }
}

// Enhanced Product Recommendation Handler
async function getProductRecommendations(sessionId, input) {
  try {
    const context = getContext(sessionId);
    const preferences = context.preferences || [];
    let recommendations;

    // Check if the user has recently asked about a specific category of products
    if (context.history.some((h) => h.intent === "product_info")) {
      recommendations = await Product.find({ category: preferences[0] }).limit(
        5
      );
      return `Here are some products in the same category you showed interest in: ${recommendations
        .map((product) => product.name)
        .join(", ")}`;
    }

    // First, check for cheap/affordable
    if (/cheap|affordable|low cost|budget/i.test(input)) {
      recommendations = cache.get("affordable_products");
      if (!recommendations) {
        console.log("Cache miss: Fetching affordable products from DB...");
        recommendations = await Product.find().sort({ price: 1 }).limit(10);
        cache.set("affordable_products", recommendations);
        console.log("Cache set: Affordable products cached.");
      } else {
        console.log("Cache hit: Affordable products retrieved from cache.");
      }
    }
    // Then, check for premium products
    else if (/expensive|premium|high-end|luxury/i.test(input)) {
      recommendations = cache.get("expensive_products");
      if (!recommendations) {
        console.log("Cache miss: Fetching expensive products from DB...");
        recommendations = await Product.find().sort({ price: -1 }).limit(10);
        cache.set("expensive_products", recommendations);
        console.log("Cache set: Expensive products cached.");
      } else {
        console.log("Cache hit: Expensive products retrieved from cache.");
      }
    }
    // Default to top-rated products if no specific category is mentioned
    else {
      recommendations = cache.get("top_products");
      if (!recommendations) {
        console.log("Cache miss: Fetching top-rated products from DB...");
        recommendations = await Product.find().sort({ rating: -1 }).limit(5);
        cache.set("top_products", recommendations);
        console.log("Cache set: Top products cached.");
      } else {
        console.log("Cache hit: Top-rated products retrieved from cache.");
      }
    }

    // Ensure recommendations is not undefined and filter products based on user preferences
    if (!Array.isArray(recommendations)) {
      recommendations = [];
    }

    const personalized = recommendations.filter((product) =>
      preferences.includes(product.category)
    );

    const finalRecommendations = personalized.length
      ? personalized
      : recommendations;

    // Format the recommendation message
    const recommendationMessage = finalRecommendations
      .map(
        (product) =>
          `${product.name} - Ksh${Number(product.price).toFixed(2)} (${
            product.rating || "N/A"
          } stars)`
      )
      .join("\n");

    return personalized.length
      ? `Top products for you based on your preferences:\n${recommendationMessage}`
      : `Here are some ${
          /cheap|affordable|low cost|budget/i.test(input)
            ? "affordable"
            : /expensive|premium|high-end|luxury/i.test(input)
            ? "premium"
            : "top-rated"
        } product recommendations:\n${recommendationMessage}`;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return "There was an error fetching product recommendations. Please try again.";
  }
}

// Search through products based on input for skin type, season, or occasion
async function searchProducts(query) {
  try {
    const allProducts = await Product.find(
      {},
      { name: 1, description: 1, category: 1 }
    );

    // Use Fuse.js to search through product names and descriptions for relevance
    const fuse = new Fuse(allProducts, {
      keys: ["name", "description", "category"],
      threshold: 0.3,
    });

    // Search products
    const results = fuse.search(query);

    if (results.length > 0) {
      return results.map((result) => result.item);
    } else {
      return [];
    }
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
