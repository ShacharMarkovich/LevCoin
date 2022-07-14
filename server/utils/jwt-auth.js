const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt-config.json');

module.exports = authorize;

function authorize(needAdmin = false, needConfirmed = false){
  if (needAdmin){
    needConfirmed = true;
  }
    return (req, res, next) => {
        console.log(req.user);
        if (!req.user) {
            // if user is not logged in
            return res.status(401).send({
                message: 'You are not logged in'
            });
        }
      //Unauthorize if not admin
      if (needAdmin && !req.user.isAdmin)
          return res.status(401).json({ message: 'Unauthorized' });
      //Unauthorize if not confirmed
      if (needConfirmed && !req.user.isConfirmed)
          return res.status(401).json({ message: 'Unauthorized' });
      next()
    }
}
