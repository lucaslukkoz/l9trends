import { Draft } from '../models';
import { getAccountForUser } from './account.service';
import { NotFoundError } from '../utils/errors';

interface DraftData {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string;
}

export async function getDrafts(userId: number, accountId: number, page: number = 1, maxResults: number = 20) {
  const account = await getAccountForUser(userId, accountId);
  const offset = (page - 1) * maxResults;

  const results = await Draft.findAll({
    where: { accountId: account.id },
    order: [['updatedAt', 'DESC']],
    offset,
    limit: maxResults + 1,
  });

  const hasNextPage = results.length > maxResults;
  const drafts = results.slice(0, maxResults);
  const nextPageToken = hasNextPage ? String(page + 1) : null;

  return {
    drafts: drafts.map((d) => ({
      id: d.id,
      to: d.to,
      cc: d.cc,
      bcc: d.bcc,
      subject: d.subject,
      bodyHtml: d.bodyHtml,
      inReplyTo: d.inReplyTo,
      references: d.references,
      updatedAt: d.updatedAt.toISOString(),
    })),
    nextPageToken,
  };
}

export async function getDraft(userId: number, accountId: number, draftId: number) {
  const account = await getAccountForUser(userId, accountId);
  const draft = await Draft.findOne({ where: { id: draftId, accountId: account.id } });
  if (!draft) throw new NotFoundError('Draft not found');
  return {
    id: draft.id,
    to: draft.to,
    cc: draft.cc,
    bcc: draft.bcc,
    subject: draft.subject,
    bodyHtml: draft.bodyHtml,
    inReplyTo: draft.inReplyTo,
    references: draft.references,
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export async function saveDraft(userId: number, accountId: number, data: DraftData) {
  const account = await getAccountForUser(userId, accountId);
  const draft = await Draft.create({
    accountId: account.id,
    to: data.to || null,
    cc: data.cc || null,
    bcc: data.bcc || null,
    subject: data.subject || null,
    bodyHtml: data.bodyHtml || null,
    inReplyTo: data.inReplyTo || null,
    references: data.references || null,
  });
  return {
    id: draft.id,
    to: draft.to,
    cc: draft.cc,
    bcc: draft.bcc,
    subject: draft.subject,
    bodyHtml: draft.bodyHtml,
    inReplyTo: draft.inReplyTo,
    references: draft.references,
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export async function updateDraft(userId: number, accountId: number, draftId: number, data: DraftData) {
  const account = await getAccountForUser(userId, accountId);
  const draft = await Draft.findOne({ where: { id: draftId, accountId: account.id } });
  if (!draft) throw new NotFoundError('Draft not found');
  await draft.update({
    to: data.to ?? draft.to,
    cc: data.cc ?? draft.cc,
    bcc: data.bcc ?? draft.bcc,
    subject: data.subject ?? draft.subject,
    bodyHtml: data.bodyHtml ?? draft.bodyHtml,
    inReplyTo: data.inReplyTo ?? draft.inReplyTo,
    references: data.references ?? draft.references,
  });
  return {
    id: draft.id,
    to: draft.to,
    cc: draft.cc,
    bcc: draft.bcc,
    subject: draft.subject,
    bodyHtml: draft.bodyHtml,
    inReplyTo: draft.inReplyTo,
    references: draft.references,
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export async function deleteDraft(userId: number, accountId: number, draftId: number) {
  const account = await getAccountForUser(userId, accountId);
  const draft = await Draft.findOne({ where: { id: draftId, accountId: account.id } });
  if (!draft) throw new NotFoundError('Draft not found');
  await draft.destroy();
  return { message: 'Rascunho excluído' };
}
