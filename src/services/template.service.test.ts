import { templateService } from './template.service';
import { prisma } from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    ritualReminderTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('TemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a template with correct data', async () => {
      const mockTemplate = {
        id: '1',
        key: 'test-template',
        name: 'Test Template',
        descriptionMarkdown: 'Test description',
        defaultTimingJson: JSON.stringify(['-1h', '-24h']),
        channelPreferencesJson: JSON.stringify({ email: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.ritualReminderTemplate.create as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const result = await templateService.createTemplate({
        key: 'test-template',
        name: 'Test Template',
        descriptionMarkdown: 'Test description',
        defaultTimingJson: ['-1h', '-24h'],
        channelPreferencesJson: { email: true },
      });

      expect(result.key).toBe('test-template');
      expect(result.defaultTimingJson).toEqual(['-1h', '-24h']);
      expect(result.channelPreferencesJson).toEqual({ email: true });
    });
  });

  describe('getTemplateByKey', () => {
    it('should return null if template not found', async () => {
      (prisma.ritualReminderTemplate.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const result = await templateService.getTemplateByKey('non-existent');
      expect(result).toBeNull();
    });

    it('should return formatted template if found', async () => {
      const mockTemplate = {
        id: '1',
        key: 'test-template',
        name: 'Test Template',
        descriptionMarkdown: '',
        defaultTimingJson: JSON.stringify(['-1h']),
        channelPreferencesJson: JSON.stringify({ email: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.ritualReminderTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const result = await templateService.getTemplateByKey('test-template');
      expect(result?.key).toBe('test-template');
      expect(result?.defaultTimingJson).toEqual(['-1h']);
    });
  });

  describe('getAllTemplates', () => {
    it('should return array of formatted templates', async () => {
      const mockTemplates = [
        {
          id: '1',
          key: 'template-1',
          name: 'Template 1',
          descriptionMarkdown: '',
          defaultTimingJson: JSON.stringify(['-1h']),
          channelPreferencesJson: JSON.stringify({ email: true }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.ritualReminderTemplate.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await templateService.getAllTemplates();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('template-1');
    });
  });
});
