import { createMocks } from 'node-mocks-http';
import { POST } from '../../app/api/auth/register/route';
import User from '../../models/User';
import connectDB from '../../lib/db';

// Mock the database connection
jest.mock('../../lib/db');

describe('/api/auth/register', () => {
  beforeEach(() => {
    connectDB.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    // Mock User.findOne to return null (user doesn't exist)
    User.findOne = jest.fn().mockResolvedValue(null);
    
    // Mock User constructor and save method
    const mockSave = jest.fn().mockResolvedValue();
    const mockToObject = jest.fn().mockReturnValue({
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    User.mockImplementation(() => ({
      save: mockSave,
      toObject: mockToObject
    }));

    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe('john@example.com');
    expect(mockSave).toHaveBeenCalled();
  });

  it('should return error if user already exists', async () => {
    // Mock User.findOne to return existing user
    User.findOne = jest.fn().mockResolvedValue({
      _id: 'existing123',
      email: 'john@example.com'
    });

    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should return validation error for invalid input', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'J', // Too short
        email: 'invalid-email',
        password: '123' // Too short
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should return error for missing required fields', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe'
        // Missing email and password
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });
});

x