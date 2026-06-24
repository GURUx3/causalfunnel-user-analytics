import { Event } from '../models/Event.js';

export async function createEvent(eventData) {
  const event = await Event.create(eventData);
  return { id: event._id.toString() };
}

export async function getHeatmapData(pageUrl) {
  const events = await Event.find(
    { pageUrl, eventType: 'click' },
    { x: 1, y: 1, _id: 0 }
  ).lean();

  return events.map(({ x, y }) => ({ x, y }));
}

export async function getDistinctPageUrls() {
  return Event.distinct('pageUrl');
}
