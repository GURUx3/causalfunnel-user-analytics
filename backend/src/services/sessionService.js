import { Event } from '../models/Event.js';
import { AppError } from '../utils/AppError.js';

export async function getAllSessions() {
  return Event.aggregate([
    {
      $group: {
        _id: '$sessionId',
        eventCount: { $sum: 1 },
        firstSeen: { $min: '$timestamp' },
        lastSeen: { $max: '$timestamp' },
      },
    },
    {
      $project: {
        _id: 0,
        sessionId: '$_id',
        eventCount: 1,
        firstSeen: 1,
        lastSeen: 1,
      },
    },
    { $sort: { lastSeen: -1 } },
  ]);
}

export async function getSessionEvents(sessionId) {
  const events = await Event.find({ sessionId })
    .sort({ timestamp: 1 })
    .select('eventType pageUrl timestamp x y -_id')
    .lean();

  if (events.length === 0) {
    throw new AppError('Session not found', 404);
  }

  return events.map(({ eventType, pageUrl, timestamp, x, y }) => {
    const base = {
      eventType,
      pageUrl,
      timestamp: timestamp.toISOString(),
    };

    if (eventType === 'click') {
      return { ...base, x, y };
    }

    return base;
  });
}

export async function getSessionStats() {
  const [result] = await Event.aggregate([
    {
      $group: {
        _id: '$sessionId',
        eventCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalEvents: { $sum: '$eventCount' },
      },
    },
  ]);

  return {
    totalSessions: result?.totalSessions ?? 0,
    totalEvents: result?.totalEvents ?? 0,
  };
}
