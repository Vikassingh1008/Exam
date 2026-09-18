const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
  req.admin = { id: 'mock_admin_id' };
  next();
};

module.exports = adminMiddleware;
