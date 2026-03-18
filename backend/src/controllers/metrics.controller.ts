import { Request, Response, NextFunction } from 'express';
import * as metricsService from '../services/metrics.service';

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await metricsService.getEmailMetrics(
      req.user!.id,
      Number(req.params.accountId),
    );
    res.json(result);
  } catch (err) { next(err); }
}
