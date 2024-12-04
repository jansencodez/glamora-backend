import Product from "../models/Product.js";
import { OrderDetails } from "../models/Order.js";
import nlp from "compromise";
import Fuse from "fuse.js";

// Main chatbot function to handle user input
export const chatBot = async (req, res) => {
  try {
    const { input } = req.body;
    const intent = getIntent(input); // Get the intent of the input
    const response = await getBotResponse(input, intent); // Get the appropriate response based on intent
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to determine the appropriate response based on the intent
async function getBotResponse(input, intent) {
  switch (intent) {
    case "greeting":
      return getGreetingResponse();
    case "product_info":
      return getProductInfo(input);
    case "product_recommendation":
      return getProductRecommendation(input);
    case "order_status":
      return getOrderStatus(input);
    case "category_info":
      return getCategoryInfo(input);
    default:
      return getGeneralResponse();
  }
}

// Function to get the intent based on user input
function getIntent(input) {
  const doc = nlp(input.toLowerCase());
  const intents = {
    greeting: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "hiya",
      "how are you?",
      "greetings",
      "howdy",
      "salutations",
      "what's up",
      "morning",
      "evening",
      "afternoon",
      "yo",
    ],
    product_info: [
      "what is",
      "tell me about",
      "product info",
      "description of",
      "info about",
      "details about",
      "features of",
      "specs of",
      "what's in",
      "how does it work",
      "what can you tell me about",
      "lipstick",
      "makeup",
    ],
    product_recommendation: [
      "recommend",
      "suggest",
      "product for",
      "what should I buy",
      "best product",
      "which product is good for",
      "what do you suggest",
      "what's the best",
      "can you recommend",
      "what would you choose",
      "options for",
      "ideal product for",
      "cheapest",
      "highest",
      "most expensive",
      "cheapest product",
      "highest product",
      "most expensive product",
      "best product for",
      "what would you",
    ],
    order_status: [
      "order status",
      "where is my order",
      "track my order",
      "track order",
      "status of my order",
      "what's the status of",
      "where's my package",
      "when will it arrive",
      "shipment status",
      "delivery status",
      "order progress",
      "order",
    ],
    general_query: [
      "how do i",
      "what is the",
      "can you tell me",
      "help with",
      "explain",
      "how to",
      "guide me on",
      "steps to",
      "tutorial on",
      "can I get",
      "need help with",
      "where can I find",
      "how do I start",
      "any information on",
    ],
    category_info: [
      "skincare",
      "makeup",
      "haircare",
      "fragrance",
      "bath & body",
      "nail care",
      "tools & brushes",
      "men's grooming",
    ],
  };

  for (const intent in intents) {
    // Check if any of the words/phrases match using a more flexible approach
    for (let phrase of intents[intent]) {
      const match = doc.match(phrase);

      if (match.found) {
        return intent;
      }
    }
  }
  if (/makeup|kit|phone|laptop|product/i.test(input)) {
    return "product_info";
  }

  return "general_query"; // Default to general query if no match is found
}

// Function to return a greeting response
async function getGreetingResponse() {
  const greetings = {
    morning: [
      "Good morning! Start your day with a touch of beauty. 🌞",
      "Rise and shine! Ready to pamper yourself today? ✨",
      "Good morning! Let's make today glow with beauty! 🌼",
      "Good morning! What beauty treat can we help you discover today? 💄",
      "Good morning! Time to look and feel fabulous! 🌸",
      "Good morning! A new day, a new opportunity to shine. ✨",
      "Rise and shine, beautiful! Your next beauty find awaits. 🌞",
      "Morning, gorgeous! Let’s make today fabulous together! 🌷",
    ],
    afternoon: [
      "Good afternoon! A little beauty break to refresh your day? 🌟",
      "Hello there! How about some mid-day glam to brighten your day? 💄",
      "Good afternoon! Ready to shop some beauty must-haves? 💅",
      "Afternoon, lovely! It’s the perfect time for a beauty pick-me-up. 🌸",
      "Good afternoon! Time for a little beauty therapy to recharge. 🌟",
      "Afternoon vibes! Let’s find the perfect product to elevate your look. ✨",
      "Hey there, gorgeous! Looking for the best beauty deals this afternoon? 💋",
      "Good afternoon! Ready to discover your next beauty obsession? 🌞",
    ],
    evening: [
      "Good evening! Wind down with some luxurious beauty products. ✨",
      "Evening vibes! Treat yourself to a little beauty pampering. 🌙",
      "Good evening! Perfect time for a beauty refresh. 🧖‍♀️",
      "Good evening! Ready for some nighttime beauty essentials? 🌜",
      "Evening, gorgeous! Let’s end the day with a little glam. 🌟",
      "Good evening! Unwind and pamper yourself with our beauty finds. 💅",
      "Evening beauty time! Ready for a relaxing self-care moment? 🌙",
      "Good evening! Let’s help you glow even after the sun sets. ✨",
    ],
    general: [
      "Hey there! How can I help you look your best today?",
      "Hello! Ready to find your new beauty favorites? 💋",
      "Welcome! Glamora's got just what you need to look stunning! ✨",
      "Hi! Let’s explore the best beauty products for your next look. 💄",
      "Hello! Need some beauty inspiration for your next purchase? 🌟",
      "Welcome! Ready to discover the beauty products that will wow you? 💅",
      "Hi there! Let’s create your perfect beauty routine together. 🌸",
      "Welcome to Glamora! Ready to find your next beauty must-have? 🌷",
      "A place for beauty lovers! Let’s find the perfect products for you. 💋",
    ],
  };

  const useGeneralGreeting = Math.random() < 0.3; // 15% chance for a general greeting

  if (useGeneralGreeting) {
    return `${
      greetings.general[Math.floor(Math.random() * greetings.general.length)]
    }`;
  }

  const timeOfDay = getTimeOfDay(); // Could be 'morning', 'afternoon', 'evening'
  const greeting =
    greetings[timeOfDay][
      Math.floor(Math.random() * greetings[timeOfDay].length)
    ];

  return `${greeting} It's a beautiful ${timeOfDay}! 🌷`;
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// Function to retrieve product information
async function getProductInfo(input) {
  try {
    const keywords = extractKeywords(input); // Extract potential product name or keywords

    // Search for a product matching the keywords
    const product = await Product.findOne({
      name: { $regex: keywords.join("|"), $options: "i" },
    });

    if (product) {
      return `The product "${product.name}" is fantastic! It costs Ksh ${product.price}. Here’s a quick overview: ${product.description}. 😍 Let me know if you need more details or want to explore similar options.`;
    } else {
      return `Hmm, I couldn’t find anything related to "${input}". Could you tell me more or try rephrasing? I’m happy to assist! 😅`;
    }
  } catch (error) {
    console.error(error);
    return "Sorry, there was an issue fetching the product details. Please try again later. 🙇‍♂️";
  }
}

// Helper function to extract potential keywords
function extractKeywords(input) {
  // Remove common words and split into potential keywords
  const commonWords = ["the", "is", "about", "of", "a", "an", "this", "that"];
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !commonWords.includes(word));
}

// Function to recommend products based on different criteria
async function getProductRecommendation(input) {
  const keywords = extractKeywords(input);
  const fuse = new Fuse(await Product.find(), {
    keys: ["name", "description"],
    threshold: 0.3, // Modify to adjust how fuzzy the match can be
  });

  const results = fuse.search(keywords.join(" "));

  if (results.length) {
    return `Here are some products you might like: ${results
      .slice(0, 3)
      .map((result) => result.item.name)
      .join(", ")} 😍`;
  } else {
    return "I couldn't find any matching products. Please try another search. 🙇‍♂️";
  }
}

// Function to retrieve order status
async function getOrderStatus(input) {
  const orderId = extractOrderId(input);
  const order = await OrderDetails.findById(orderId);

  if (order) {
    return `Your order #${orderId} is currently ${order.status}. You can expect it to arrive in ${order.deliveryTime} days.`;
  } else {
    return `I couldn’t find an order with the ID #${orderId}. Please double-check and try again. 😅`;
  }
}

// Helper function to extract order ID
function extractOrderId(input) {
  const match = input.match(/order\s*(\d+)/);
  return match ? match[1] : null;
}

// Function to retrieve category information
async function getCategoryInfo(input) {
  const category = input.toLowerCase();
  const productsInCategory = await Product.find({
    category: { $regex: category, $options: "i" },
  });

  if (productsInCategory.length) {
    return `We have several amazing products in the ${category} category: ${productsInCategory
      .map((product) => product.name)
      .join(", ")}`;
  } else {
    return `Sorry, there are no products in the "${category}" category at the moment. Please check back later. 🙇‍♂️`;
  }
}

// Function for a general response if no intent is found
function getGeneralResponse() {
  return "I’m sorry, I didn’t quite catch that. Could you please rephrase or ask something else? 🙇‍♂️";
}
