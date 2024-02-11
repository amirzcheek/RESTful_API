const jwt = require('jsonwebtoken');
const userModule = require('./userModule');

const secretKey = 'amirzcheek666';

const isAdminUser = async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }
  
      const decoded = jwt.verify(token, secretKey);
      const username = decoded.username;
  
      const user = await userModule.findOne({ name: username });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
      }
      if (user.isAdmin) {
        res.locals.isAdminUser = true;
        next();
      } else {
        res.locals.isAdminUser = false;
        next();
      }
    } catch (error) {
      console.error('Error in isAdmin middleware:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
}
module.exports = isAdminUser;