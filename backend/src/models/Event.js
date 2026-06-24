import mongoose from 'mongoose';

const EVENT_TYPES = ['page_view', 'click'];

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES,
      index: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    x: {
      type: Number,
      required: function () {
        return this.eventType === 'click';
      },
    },
    y: {
      type: Number,
      required: function () {
        return this.eventType === 'click';
      },
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ pageUrl: 1, eventType: 1 });

export const Event = mongoose.model('Event', eventSchema);
export { EVENT_TYPES };
