const jwt = require('jsonwebtoken');
const userModule = require('./userModule');

const secretKey = 'amirzcheek666';

const isAdmin = async (req, res, next) => {
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
          next();
        } else {
            return res.status(403).json({ error: 'Forbidden: User is not an admin' });
        }
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
  
module.exports = isAdmin;