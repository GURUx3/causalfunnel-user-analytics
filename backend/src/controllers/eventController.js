import * as eventService from '../services/eventService.js';
import { AppError } from '../utils/AppError.js';

export async function createEvent(req, res) {
  const result = await eventService.createEvent(req.validatedEvent);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getHeatmap(req, res) {
  const { pageUrl } = req.query;

  if (!pageUrl) {
    throw new AppError('pageUrl query parameter is required', 400);
  }

  const data = await eventService.getHeatmapData(pageUrl);

  res.json({
    success: true,
    data,
  });
}

export async function getPageUrls(_req, res) {
  const data = await eventService.getDistinctPageUrls();

  res.json({
    success: true,
    data,
  });
}
