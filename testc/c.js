import nlp from "compromise";

function getIntent(input) {
  // Convert input to lowercase and process with compromise
  const doc = nlp(input.toLowerCase());
  console.log("Processed Document:", doc.out("text")); // Check how compromise processes the text

  const intents = {
    greeting: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "hiya",
      "greetings",
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
      "specifications for",
      "specs of",
      "what's in",
      "how does it work",
      "what can you tell me about",
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

  // Loop through the intents and check if the input matches any of them using compromise's match
  for (const intent in intents) {
    // Check if any of the words/phrases match using a more flexible approach
    for (let phrase of intents[intent]) {
      const match = doc.match(phrase);
      console.log(`Checking ${intent} for phrase "${phrase}":`, match.found); // Debugging output

      if (match.found) {
        return intent;
      }
    }
  }

  // Fallback: Check for product-related queries using regex
  if (/makeup|kit|phone|laptop|product/i.test(input)) {
    console.log("Fallback: Product info matched by regex"); // Debugging output
    return "product_info";
  }

  // Default to general_query if no match is found
  console.log("Default: General query"); // Debugging output
  return "general_query";
}

// Test cases
console.log(getIntent("Can you tell me about makeup?")); // Expected: "product_info"
console.log(getIntent("Hi there!")); // Expected: "greeting"
console.log(getIntent("What's the status of my order?")); // Expected: "order_status"
console.log(getIntent("How do I make a cake?")); // Expected: "general_query"
