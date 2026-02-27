const authMiddleware = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
};

export default authMiddleware;