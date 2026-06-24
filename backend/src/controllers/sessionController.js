import * as sessionService from '../services/sessionService.js';

export async function getSessions(_req, res) {
  const [sessions, stats] = await Promise.all([
    sessionService.getAllSessions(),
    sessionService.getSessionStats(),
  ]);

  const formattedSessions = sessions.map((session) => ({
    sessionId: session.sessionId,
    eventCount: session.eventCount,
    firstSeen: session.firstSeen.toISOString(),
    lastSeen: session.lastSeen.toISOString(),
  }));

  res.json({
    success: true,
    data: formattedSessions,
    meta: stats,
  });
}

export async function getSessionDetail(req, res) {
  const { sessionId } = req.params;
  const data = await sessionService.getSessionEvents(sessionId);

  res.json({
    success: true,
    data,
  });
}
