import { EVENT_TYPES } from '../models/Event.js';
import { AppError } from '../utils/AppError.js';

export function validateEvent(req, _res, next) {
  const { sessionId, eventType, pageUrl, timestamp, x, y } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return next(new AppError('sessionId is required and must be a string', 400));
  }

  if (!eventType || !EVENT_TYPES.includes(eventType)) {
    return next(
      new AppError(`eventType is required and must be one of: ${EVENT_TYPES.join(', ')}`, 400)
    );
  }

  if (!pageUrl || typeof pageUrl !== 'string') {
    return next(new AppError('pageUrl is required and must be a string', 400));
  }

  if (!timestamp) {
    return next(new AppError('timestamp is required', 400));
  }

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return next(new AppError('timestamp must be a valid ISO date string', 400));
  }

  if (eventType === 'click') {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return next(new AppError('x and y coordinates are required for click events', 400));
    }
  }

  req.validatedEvent = {
    sessionId,
    eventType,
    pageUrl,
    timestamp: parsedTimestamp,
    ...(eventType === 'click' ? { x, y } : {}),
  };

  next();
}
