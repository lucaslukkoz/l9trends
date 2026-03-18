import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DraftAttributes {
  id: number;
  accountId: number;
  to: string | null;
  cc: string | null;
  bcc: string | null;
  subject: string | null;
  bodyHtml: string | null;
  inReplyTo: string | null;
  references: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DraftCreationAttributes
  extends Optional<
    DraftAttributes,
    | 'id'
    | 'to'
    | 'cc'
    | 'bcc'
    | 'subject'
    | 'bodyHtml'
    | 'inReplyTo'
    | 'references'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Draft
  extends Model<DraftAttributes, DraftCreationAttributes>
  implements DraftAttributes
{
  declare id: number;
  declare accountId: number;
  declare to: string | null;
  declare cc: string | null;
  declare bcc: string | null;
  declare subject: string | null;
  declare bodyHtml: string | null;
  declare inReplyTo: string | null;
  declare references: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Draft.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'email_accounts',
        key: 'id',
      },
    },
    to: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cc: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bcc: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bodyHtml: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
    },
    inReplyTo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    references: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'drafts',
    underscored: true,
    timestamps: true,
  },
);

export default Draft;
