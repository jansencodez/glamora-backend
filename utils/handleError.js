module.exports = (res, error, message = "Something went wrong") => {
  console.error(error); // Log the error for server-side debugging
  res.status(500).json({
    success: false,
    message: message,
    error: error.message || error, // Send the error message to the client
  });
};
