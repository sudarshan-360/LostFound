import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Item from '../models/Item';
import User from '../models/User';
import SimilarityLog from '../models/SimilarityLog';

// Mock DB connector to avoid reconnecting (we already connect in jest.setup.js)
jest.mock('../lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));

// Mock CLIP client
jest.mock('../lib/clipClient', () => {
  return {
    __esModule: true,
    embedTextAndImage: jest.fn(async () => ({ embedding: [0.1, 0.2, 0.3], model: 'test-model' })),
    compareQuery: jest.fn(async (_q: number[], items: { id: string }[]) => {
      // Default scores (can be overridden per-test)
      return items.map((it, idx) => ({ id: it.id, score: 0.5 + idx * 0.1 }));
    }),
  };
});

// Mock nodemailer to capture emails
const sendMailMock = jest.fn(async () => ({ messageId: 'test-message-id' }));
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
  createTransport: () => ({ sendMail: sendMailMock }),
}));

const { compareQuery } = jest.requireMock('../lib/clipClient');

let runMatchingForItemId: (itemId: string) => Promise<{ processed: number; notified: number }>;

describe('CLIP-based matching and notifications', () => {
  beforeAll(async () => {
    // Ensure threshold is 0.7 for these tests
    process.env.SIMILARITY_THRESHOLD = '0.7';
    // Import module under test after mocks are in place
    const mod = await import('../lib/matching');
    runMatchingForItemId = mod.runMatchingForItemId;
  });

  beforeEach(async () => {
    sendMailMock.mockClear();
    // Clean collections (redundant with jest.setup but safe in case order differs)
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it('lost→found: sends email when similarity ≥ 0.7', async () => {
    // Create users
    const lostUser = await User.create({ name: 'Lost User', email: 'lost@vitstudent.ac.in' });
    const foundUser = await User.create({ name: 'Finder', email: 'finder@vit.ac.in' });

    // Create a found item with precomputed embedding (counterpart)
    const found = await Item.create({
      userId: foundUser._id,
      type: 'found',
      title: 'Blue Backpack',
      description: 'Nike bag with blue strap',
      category: 'Bags',
      location: { text: 'Library' },
      images: [],
      status: 'Available',
      contactInfo: { email: 'finder@vit.ac.in' },
      embedding: [0.9, 0.1, 0.0],
    });

    // Create a lost item (source)
    const lost = await Item.create({
      userId: lostUser._id,
      type: 'lost',
      title: 'Blue Backpack',
      description: 'Nike backpack with blue strap',
      category: 'Bags',
      location: { text: 'Library' },
      images: [],
      status: 'Available',
      contactInfo: { email: 'lost@vitstudent.ac.in' },
    });

    // Force compareQuery to return a single high score ≥ 0.7
    (compareQuery as jest.Mock).mockResolvedValueOnce([
      { id: found._id.toString(), score: 0.72 },
    ]);

    const res = await runMatchingForItemId(lost._id.toString());

    expect(res.notified).toBe(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe('lost@vitstudent.ac.in');

    const log = await SimilarityLog.findOne({
      sourceItemId: lost._id,
      targetItemId: found._id,
      direction: 'lost_to_found',
    });
    expect(log).toBeTruthy();
    expect(log?.notified).toBe(true);
    expect(log?.score).toBeCloseTo(0.72, 5);
  });

  it('found→lost: sends email when similarity ≥ 0.7', async () => {
    const lostUser = await User.create({ name: 'Owner', email: 'owner@vit.ac.in' });
    const foundUser = await User.create({ name: 'Finder', email: 'finder@vitstudent.ac.in' });

    // Lost item (counterpart) with embedding
    const lost = await Item.create({
      userId: lostUser._id,
      type: 'lost',
      title: 'iPhone 13',
      description: 'Blue case, small scratch on screen',
      category: 'Electronics',
      location: { text: 'SJT' },
      images: [],
      status: 'Available',
      contactInfo: { email: 'owner@vit.ac.in' },
      embedding: [0.2, 0.8, 0.1],
    });

    // Found item (source)
    const found = await Item.create({
      userId: foundUser._id,
      type: 'found',
      title: 'iPhone',
      description: 'Looks like iPhone 13 with blue case',
      category: 'Electronics',
      location: { text: 'SJT' },
      images: [],
      status: 'Available',
      contactInfo: { email: 'finder@vitstudent.ac.in' },
    });

    (compareQuery as jest.Mock).mockResolvedValueOnce([
      { id: lost._id.toString(), score: 0.85 },
    ]);

    const res = await runMatchingForItemId(found._id.toString());

    expect(res.notified).toBe(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    // For found_to_lost, email goes to finder (source reporter)
    expect(sendMailMock.mock.calls[0][0].to).toBe('finder@vitstudent.ac.in');

    const log = await SimilarityLog.findOne({
      sourceItemId: found._id,
      targetItemId: lost._id,
      direction: 'found_to_lost',
    });
    expect(log).toBeTruthy();
    expect(log?.notified).toBe(true);
    expect(log?.score).toBeCloseTo(0.85, 5);
  });

  it('no matches: does not send email when all scores < 0.7', async () => {
    const u1 = await User.create({ name: 'A', email: 'a@vit.ac.in' });
    const u2 = await User.create({ name: 'B', email: 'b@vit.ac.in' });

    const found = await Item.create({
      userId: u2._id,
      type: 'found',
      title: 'Red Umbrella',
      description: 'Plain red',
      category: 'Other',
      location: { text: 'MB' },
      images: [],
      status: 'Available',
      embedding: [0.3, 0.3, 0.3],
    });

    const lost = await Item.create({
      userId: u1._id,
      type: 'lost',
      title: 'Blue Umbrella',
      description: 'Plain blue',
      category: 'Other',
      location: { text: 'SJT' },
      images: [],
      status: 'Available',
      contactInfo: { email: 'a@vit.ac.in' },
    });

    (compareQuery as jest.Mock).mockResolvedValueOnce([
      { id: found._id.toString(), score: 0.69 },
    ]);

    const res = await runMatchingForItemId(lost._id.toString());

    expect(res.notified).toBe(0);
    expect(sendMailMock).not.toHaveBeenCalled();
    const log = await SimilarityLog.findOne({ direction: 'lost_to_found' });
    expect(log).toBeFalsy();
  });

  it('multiple matches: sends multiple emails for multiple counterparts', async () => {
    const lostUser = await User.create({ name: 'Lost', email: 'lost@vit.ac.in' });
    const f1User = await User.create({ name: 'F1', email: 'f1@vit.ac.in' });
    const f2User = await User.create({ name: 'F2', email: 'f2@vit.ac.in' });

    const f1 = await Item.create({ userId: f1User._id, type: 'found', title: 'Wallet', description: 'Black leather', category: 'Other', location: { text: 'Library' }, images: [], status: 'Available', embedding: [0.5] });
    const f2 = await Item.create({ userId: f2User._id, type: 'found', title: 'Wallet', description: 'Black leather with scratch', category: 'Other', location: { text: 'Library' }, images: [], status: 'Available', embedding: [0.6] });

    const lost = await Item.create({ userId: lostUser._id, type: 'lost', title: 'Wallet', description: 'Black leather wallet', category: 'Other', location: { text: 'Library' }, images: [], status: 'Available', contactInfo: { email: 'lost@vit.ac.in' } });

    (compareQuery as jest.Mock).mockResolvedValueOnce([
      { id: f1._id.toString(), score: 0.75 },
      { id: f2._id.toString(), score: 0.82 },
    ]);

    const res1 = await runMatchingForItemId(lost._id.toString());
    expect(res1.notified).toBe(2);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    const logs = await SimilarityLog.find({
      sourceItemId: lost._id,
      direction: 'lost_to_found',
    });
    expect(logs.length).toBe(2);
    expect(logs.every((l) => l.notified)).toBe(true);
  });
});