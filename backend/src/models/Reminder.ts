import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReminderAttributes {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: Date;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReminderCreationAttributes
  extends Optional<ReminderAttributes, 'id' | 'description' | 'isRead' | 'createdAt' | 'updatedAt'> {}

class Reminder
  extends Model<ReminderAttributes, ReminderCreationAttributes>
  implements ReminderAttributes
{
  declare id: number;
  declare userId: number;
  declare title: string;
  declare description: string | null;
  declare dueDate: Date;
  declare isRead: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Reminder.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'reminders',
    underscored: true,
    timestamps: true,
  },
);

export default Reminder;
