import sequelize from '../config/database';
import User from './User';
import GmailToken from './GmailToken';
import EmailAccount from './EmailAccount';
import Email from './Email';
import EmailAttachment from './EmailAttachment';
import Reminder from './Reminder';

// Legacy: User <-> GmailToken (kept for backward compatibility)
User.hasOne(GmailToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
GmailToken.belongsTo(User, { foreignKey: 'userId' });

// User <-> EmailAccount
User.hasMany(EmailAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
EmailAccount.belongsTo(User, { foreignKey: 'userId' });

// EmailAccount <-> Email
EmailAccount.hasMany(Email, { foreignKey: 'accountId', onDelete: 'CASCADE' });
Email.belongsTo(EmailAccount, { foreignKey: 'accountId' });

// Email <-> EmailAttachment
Email.hasMany(EmailAttachment, { foreignKey: 'emailId', onDelete: 'CASCADE', as: 'attachments' });
EmailAttachment.belongsTo(Email, { foreignKey: 'emailId', as: 'email' });

// User <-> Reminder
User.hasMany(Reminder, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reminder.belongsTo(User, { foreignKey: 'userId' });

export { sequelize, User, GmailToken, EmailAccount, Email, EmailAttachment, Reminder };
