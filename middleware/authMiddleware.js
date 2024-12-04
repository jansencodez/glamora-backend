import jwt from "jsonwebtoken";

export const protect = (roles = []) => {
  return (req, res, next) => {
    // Get the Authorization header
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const [bearer, token] = authorizationHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the decoded user data to the request object
      req.user = decoded;

      // Check if the user's role matches the required roles
      if (roles.length && !roles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Access forbidden: Insufficient role" });
      }

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      return res.status(401).json({ message: "Token is not valid" });
    }
  };
};
