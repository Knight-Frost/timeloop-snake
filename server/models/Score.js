const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { User } = require('./User');

const Score = sequelize.define('Score', {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  loops_survived: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

Score.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Score, { foreignKey: 'userId' });

module.exports = { Score };
