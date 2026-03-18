import { simpleParser } from 'mailparser';
import EmailAccount from '../../models/EmailAccount';
import Email from '../../models/Email';
import EmailAttachment from '../../models/EmailAttachment';
import { createImapClient } from './client';
import { invalidatePattern } from '../../services/cache.service';

const FIRST_SYNC_LIMIT = 200;

export async function syncImapAccount(account: EmailAccount): Promise<void> {
  const client = await createImapClient(account);

  try {
    const lock = await client.getMailboxLock('INBOX');

    try {
      let uids: number[];

      if (account.lastSyncUid) {
        // Incremental sync: fetch messages newer than lastSyncUid
        const searchResult = await client.search(
          { uid: `${account.lastSyncUid + 1}:*` },
          { uid: true },
        );
        // Filter out the lastSyncUid itself (IMAP range is inclusive)
        uids = (searchResult as number[]).filter(
          (uid) => uid > account.lastSyncUid!,
        );
      } else {
        // First sync: fetch last N messages by sequence number
        const status = await client.status('INBOX', { messages: true });
        const totalMessages = status.messages || 0;

        if (totalMessages === 0) {
          return;
        }

        const startSeq = Math.max(1, totalMessages - FIRST_SYNC_LIMIT + 1);
        const searchResult = await client.search(
          { seq: `${startSeq}:*` },
          { uid: true },
        );
        uids = searchResult as number[];
      }

      if (uids.length === 0) {
        return;
      }

      let highestUid = account.lastSyncUid || 0;

      const uidRange = uids.join(',');

      for await (const msg of client.fetch(
        uidRange,
        { envelope: true, source: true, uid: true, flags: true },
        { uid: true },
      )) {
        const uid = msg.uid;

        if (!msg.source) continue;

        if (uid > highestUid) {
          highestUid = uid;
        }

        // Parse the raw email source
        const parsed = await simpleParser(msg.source);

        const fromAddress = parsed.from?.text || '';
        const toAddress = parsed.to
          ? Array.isArray(parsed.to)
            ? parsed.to.map((t) => t.text).join(', ')
            : parsed.to.text
          : '';
        const subject = parsed.subject || '';
        const date = parsed.date || new Date();
        const bodyHtml =
          typeof parsed.html === 'string' ? parsed.html : null;
        const bodyText = parsed.text || null;
        const snippet = bodyText ? bodyText.substring(0, 200) : '';
        const isRead = msg.flags
          ? msg.flags.has('\\Seen')
          : false;
        const hasAttachments =
          parsed.attachments && parsed.attachments.length > 0;

        // Create email record (ignore duplicates based on unique index)
        const [emailRecord, created] = await Email.findOrCreate({
          where: { accountId: account.id, messageUid: String(uid) },
          defaults: {
            accountId: account.id,
            messageUid: String(uid),
            fromAddress,
            toAddress,
            subject,
            snippet,
            bodyHtml,
            bodyText,
            date,
            isRead,
            hasAttachments: !!hasAttachments,
          },
        });

        // Create attachment records for new emails
        if (created && parsed.attachments && parsed.attachments.length > 0) {
          const attachmentRecords = parsed.attachments.map((att, idx) => ({
            emailId: emailRecord.id,
            filename: att.filename || 'unnamed',
            mimeType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            contentId: att.contentId || `part-${idx}`,
          }));

          await EmailAttachment.bulkCreate(attachmentRecords);
        }
      }

      // Update sync state on the account
      await account.update({
        lastSyncUid: highestUid,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        syncError: null,
      });

      // Invalidate Redis cache so next API call gets fresh data
      await invalidatePattern(`inbox:${account.id}:*`);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
