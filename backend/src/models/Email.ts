import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmailAttributes {
  id: number;
  accountId: number;
  messageUid: string;
  threadId: string | null;
  fromAddress: string;
  toAddress: string | null;
  subject: string | null;
  snippet: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  date: Date;
  isRead: boolean;
  labels: string[] | null;
  hasAttachments: boolean;
  isTrashed: boolean;
  trashedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailCreationAttributes
  extends Optional<
    EmailAttributes,
    | 'id'
    | 'threadId'
    | 'toAddress'
    | 'subject'
    | 'snippet'
    | 'bodyHtml'
    | 'bodyText'
    | 'isRead'
    | 'labels'
    | 'hasAttachments'
    | 'isTrashed'
    | 'trashedAt'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Email
  extends Model<EmailAttributes, EmailCreationAttributes>
  implements EmailAttributes
{
  declare id: number;
  declare accountId: number;
  declare messageUid: string;
  declare threadId: string | null;
  declare fromAddress: string;
  declare toAddress: string | null;
  declare subject: string | null;
  declare snippet: string | null;
  declare bodyHtml: string | null;
  declare bodyText: string | null;
  declare date: Date;
  declare isRead: boolean;
  declare labels: string[] | null;
  declare hasAttachments: boolean;
  declare isTrashed: boolean;
  declare trashedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Email.init(
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
    messageUid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    threadId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fromAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    toAddress: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    snippet: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bodyHtml: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
    },
    bodyText: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    labels: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    hasAttachments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isTrashed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    trashedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'emails',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['account_id', 'message_uid'],
      },
    ],
  },
);

export default Email;
