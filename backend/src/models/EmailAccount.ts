import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmailAccountAttributes {
  id: number;
  userId: number;
  provider: 'gmail' | 'imap';
  email: string;
  displayName: string | null;
  isActive: boolean;
  // Gmail fields
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  // IMAP fields
  imapHost: string | null;
  imapPort: number | null;
  smtpHost: string | null;
  smtpPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  useTls: boolean;
  // Sync state
  lastSyncUid: number | null;
  lastSyncAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  // Signature
  signatureHtml: string | null;
  signatureEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailAccountCreationAttributes
  extends Optional<
    EmailAccountAttributes,
    | 'id'
    | 'displayName'
    | 'isActive'
    | 'accessToken'
    | 'refreshToken'
    | 'tokenExpiresAt'
    | 'imapHost'
    | 'imapPort'
    | 'smtpHost'
    | 'smtpPort'
    | 'imapUser'
    | 'imapPassword'
    | 'useTls'
    | 'lastSyncUid'
    | 'lastSyncAt'
    | 'syncStatus'
    | 'syncError'
    | 'signatureHtml'
    | 'signatureEnabled'
    | 'createdAt'
    | 'updatedAt'
  > {}

class EmailAccount
  extends Model<EmailAccountAttributes, EmailAccountCreationAttributes>
  implements EmailAccountAttributes
{
  declare id: number;
  declare userId: number;
  declare provider: 'gmail' | 'imap';
  declare email: string;
  declare displayName: string | null;
  declare isActive: boolean;
  declare accessToken: string | null;
  declare refreshToken: string | null;
  declare tokenExpiresAt: Date | null;
  declare imapHost: string | null;
  declare imapPort: number | null;
  declare smtpHost: string | null;
  declare smtpPort: number | null;
  declare imapUser: string | null;
  declare imapPassword: string | null;
  declare useTls: boolean;
  declare lastSyncUid: number | null;
  declare lastSyncAt: Date | null;
  declare syncStatus: 'idle' | 'syncing' | 'error';
  declare syncError: string | null;
  declare signatureHtml: string | null;
  declare signatureEnabled: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EmailAccount.init(
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
    provider: {
      type: DataTypes.ENUM('gmail', 'imap'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Gmail fields
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // IMAP fields
    imapHost: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    imapPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    smtpHost: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    smtpPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    imapUser: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    imapPassword: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    useTls: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Sync state
    lastSyncUid: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    syncStatus: {
      type: DataTypes.ENUM('idle', 'syncing', 'error'),
      defaultValue: 'idle',
    },
    syncError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    signatureHtml: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    signatureEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'email_accounts',
    underscored: true,
    timestamps: true,
  },
);

export default EmailAccount;
