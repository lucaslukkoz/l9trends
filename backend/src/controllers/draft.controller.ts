import { Request, Response, NextFunction } from 'express';
import * as draftService from '../services/draft.service';

export async function listDrafts(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageToken } = req.query;
    const page = pageToken ? parseInt(pageToken as string) : 1;
    const result = await draftService.getDrafts(
      req.user!.id,
      Number(req.params.accountId),
      page,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function getDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await draftService.getDraft(
      req.user!.id,
      Number(req.params.accountId),
      Number(req.params.draftId),
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function saveDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await draftService.saveDraft(
      req.user!.id,
      Number(req.params.accountId),
      req.body,
    );
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function updateDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await draftService.updateDraft(
      req.user!.id,
      Number(req.params.accountId),
      Number(req.params.draftId),
      req.body,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function deleteDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await draftService.deleteDraft(
      req.user!.id,
      Number(req.params.accountId),
      Number(req.params.draftId),
    );
    res.json(result);
  } catch (err) { next(err); }
}
