const mongoose = require('mongoose');

function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  };
}

module.exports = { validateObjectId };
