import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmailAttachmentAttributes {
  id: number;
  emailId: number;
  filename: string;
  mimeType: string;
  size: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailAttachmentCreationAttributes
  extends Optional<EmailAttachmentAttributes, 'id' | 'size' | 'createdAt' | 'updatedAt'> {}

class EmailAttachment
  extends Model<EmailAttachmentAttributes, EmailAttachmentCreationAttributes>
  implements EmailAttachmentAttributes
{
  declare id: number;
  declare emailId: number;
  declare filename: string;
  declare mimeType: string;
  declare size: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EmailAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    emailId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'emails',
        key: 'id',
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'email_attachments',
    underscored: true,
    timestamps: true,
  },
);

export default EmailAttachment;
