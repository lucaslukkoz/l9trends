import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface GmailTokenAttributes {
  id: number;
  userId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  gmailEmail: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GmailTokenCreationAttributes
  extends Optional<GmailTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class GmailToken
  extends Model<GmailTokenAttributes, GmailTokenCreationAttributes>
  implements GmailTokenAttributes
{
  declare id: number;
  declare userId: number;
  declare accessToken: string;
  declare refreshToken: string;
  declare expiresAt: Date;
  declare gmailEmail: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GmailToken.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gmailEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'gmail_tokens',
    underscored: true,
    timestamps: true,
  },
);

export default GmailToken;
