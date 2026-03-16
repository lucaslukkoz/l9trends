import { sequelize, User, GmailToken, EmailAccount } from '../models';

async function migrateGmailTokens(): Promise<void> {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    console.log('Syncing models...');
    await sequelize.sync();
    console.log('Models synced.');

    console.log('Fetching GmailToken records...');
    const gmailTokens = await GmailToken.findAll({
      include: [{ model: User }],
    });

    console.log(`Found ${gmailTokens.length} GmailToken record(s) to migrate.`);

    let created = 0;
    let skipped = 0;

    for (const token of gmailTokens) {
      const [, wasCreated] = await EmailAccount.findOrCreate({
        where: {
          userId: token.userId,
          provider: 'gmail',
          email: token.gmailEmail,
        },
        defaults: {
          userId: token.userId,
          provider: 'gmail',
          email: token.gmailEmail,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          tokenExpiresAt: token.expiresAt,
          isActive: true,
          syncStatus: 'idle',
        },
      });

      if (wasCreated) {
        created++;
        console.log(`  Created EmailAccount for ${token.gmailEmail} (userId=${token.userId})`);
      } else {
        skipped++;
        console.log(`  Skipped ${token.gmailEmail} (userId=${token.userId}) - already exists`);
      }
    }

    console.log(`\nMigration complete: ${created} created, ${skipped} skipped.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

migrateGmailTokens();
