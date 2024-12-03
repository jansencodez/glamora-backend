const tf = require("@tensorflow/tfjs");

// Define the model architecture
const model = tf.sequential();
model.add(
  tf.layers.embedding({
    inputShape: [1],
    outputDim: 10, // Set outputDim to a positive integer
    inputDim: 1000,
  })
);
model.add(tf.layers.flatten());
model.add(
  tf.layers.dense({
    units: 8,
    activation: "softmax",
  })
);

// Compile the model
model.compile({
  optimizer: tf.optimizers.adam(),
  loss: "sparseCategoricalCrossentropy",
  metrics: ["accuracy"],
});

// Define the categories
const categories = [
  "greeting",
  "product_info",
  "product_recommendation",
  "order_status",
  "category_info",
  "general_query",
];

// Define the training data
const trainingData = [
  // Greeting
  { input: "hello", category: "greeting" },
  { input: "hi", category: "greeting" },
  { input: "hey", category: "greeting" },
  { input: "good morning", category: "greeting" },
  { input: "good afternoon", category: "greeting" },
  { input: "good evening", category: "greeting" },
  { input: "hiya", category: "greeting" },
  { input: "greetings", category: "greeting" },
  { input: "howdy", category: "greeting" },
  { input: "salutations", category: "greeting" },
  { input: "what's up", category: "greeting" },
  { input: "morning", category: "greeting" },
  { input: "evening", category: "greeting" },
  { input: "afternoon", category: "greeting" },
  { input: "yo", category: "greeting" },

  // Product Info
  { input: "what is", category: "product_info" },
  { input: "tell me about", category: "product_info" },
  { input: "product info", category: "product_info" },
  { input: "description of", category: "product_info" },
  { input: "info about", category: "product_info" },
  { input: "details about", category: "product_info" },
  { input: "features of", category: "product_info" },
  { input: "specifications for", category: "product_info" },
  { input: "specs of", category: "product_info" },
  { input: "what's in", category: "product_info" },
  { input: "how does it work", category: "product_info" },
  { input: "what can you tell me about", category: "product_info" },

  // Product Recommendation
  { input: "recommend", category: "product_recommendation" },
  { input: "suggest", category: "product_recommendation" },
  { input: "product for", category: "product_recommendation" },
  { input: "what should I buy", category: "product_recommendation" },
  { input: "best product", category: "product_recommendation" },
  { input: "which product is good for", category: "product_recommendation" },
  { input: "what do you suggest", category: "product_recommendation" },
  { input: "what's the best", category: "product_recommendation" },
  { input: "can you recommend", category: "product_recommendation" },
  { input: "what would you choose", category: "product_recommendation" },
  { input: "options for", category: "product_recommendation" },
  { input: "ideal product for", category: "product_recommendation" },

  // Order Status
  { input: "order status", category: "order_status" },
  { input: "where is my order", category: "order_status" },
  { input: "track my order", category: "order_status" },
  { input: "track order", category: "order_status" },
  { input: "status of my order", category: "order_status" },
  { input: "what's the status of", category: "order_status" },
  { input: "where's my package", category: "order_status" },
  { input: "when will it arrive", category: "order_status" },
  { input: "shipment status", category: "order_status" },
  { input: "delivery status", category: "order_status" },
  { input: "order progress", category: "order_status" },

  // General Query
  { input: "how do i", category: "general_query" },
  { input: "what is the", category: "general_query" },
  { input: "can you tell me", category: "general_query" },
  { input: "help with", category: "general_query" },
  { input: "explain", category: "general_query" },
  { input: "how to", category: "general_query" },
  { input: "guide me on", category: "general_query" },
  { input: "steps to", category: "general_query" },
  { input: "tutorial on", category: "general_query" },
  { input: "can I get", category: "general_query" },
  { input: "need help with", category: "general_query" },
  { input: "where can I find", category: "general_query" },

  //category info

  { input: "tell me about", category: "category_info" },
  { input: "info about", category: "category_info" },
  { input: "details about", category: "category_info" },
  { input: "features of", category: "category_info" },
  { input: "specifications for", category: "category_info" },
  { input: "specs of", category: "category_info" },
  { input: "what's in", category: "category_info" },
  { input: "how does it work", category: "category_info" },
  { input: "what can you tell me about", category: "category_info" },
  { input: "what is", category: "category_info" },
  { input: "tell me about", category: "category_info" },
];

// Train the model
async function trainModel() {
  const inputs = trainingData.map((data) => data.input);
  const labels = trainingData.map((data) => categories.indexOf(data.category));

  const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
  const labelTensor = tf.tensor1d(labels, "int32");

  await model.fit(inputTensor, labelTensor, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
  });
}

// Use the model to classify user input
async function classifyInput(input) {
  const inputTensor = tf.tensor2d([input], [1, 1]);
  const output = await model.predict(inputTensor);
  const categoryIndex = output.argMax(1).dataSync()[0];
  return categories[categoryIndex];
}

module.exports = { trainModel, classifyInput };
