import type { ColumnSchema } from '@/types/database';
import type {
  ColumnMockConfig,
  GeneratedRow,
  MockDataOptions,
  MockDataType,
  MockTypeSuggestion,
} from '@/types/mock-data';

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number, precision: number = 2): number {
    const value = this.next() * (max - min) + min;
    return Number(value.toFixed(precision));
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Sample data pools
const FIRST_NAMES = [
  'James',
  'John',
  'Robert',
  'Michael',
  'William',
  'David',
  'Richard',
  'Joseph',
  'Mary',
  'Patricia',
  'Jennifer',
  'Linda',
  'Elizabeth',
  'Barbara',
  'Susan',
  'Jessica',
  'Thomas',
  'Charles',
  'Daniel',
  'Matthew',
  'Sarah',
  'Karen',
  'Nancy',
  'Lisa',
  '张伟',
  '王芳',
  '李娜',
  '刘洋',
  '陈静',
  '杨帆',
  '赵敏',
  '周杰',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  '张',
  '王',
  '李',
  '刘',
  '陈',
  '杨',
  '赵',
  '周',
  '吴',
  '徐',
];

const DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'example.com',
  'company.com',
  'business.org',
  'mail.net',
  'qq.com',
  '163.com',
];

const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Seattle',
  'Denver',
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '成都',
  '武汉',
  '西安',
];

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'Brazil',
  'India',
  'Mexico',
  'Spain',
];

const STATES = [
  'California',
  'Texas',
  'Florida',
  'New York',
  'Pennsylvania',
  'Illinois',
  'Ohio',
  'Georgia',
  'North Carolina',
  'Michigan',
  'Washington',
  'Arizona',
];

const STREET_SUFFIXES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Pl'];

const COMPANY_SUFFIXES = [
  'Inc',
  'LLC',
  'Corp',
  'Co',
  'Ltd',
  'Group',
  'Holdings',
];

const COMPANY_NAMES = [
  'Tech',
  'Global',
  'Digital',
  'Cloud',
  'Smart',
  'Pro',
  'Prime',
  'Elite',
  'Nova',
  'Apex',
  'Vertex',
  'Quantum',
  'Cyber',
  'Meta',
  'Nexus',
  'Fusion',
];

const JOB_TITLES = [
  'Software Engineer',
  'Product Manager',
  'Data Analyst',
  'Designer',
  'Developer',
  'Marketing Manager',
  'Sales Representative',
  'HR Specialist',
  'Accountant',
  'Project Manager',
  'Business Analyst',
  'QA Engineer',
  'DevOps Engineer',
];

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Research',
  'Legal',
  'IT',
];

const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
];

const PRODUCT_ADJECTIVES = [
  'Premium',
  'Professional',
  'Essential',
  'Ultimate',
  'Classic',
  'Modern',
  'Luxury',
  'Compact',
  'Portable',
  'Wireless',
  'Smart',
  'Advanced',
];

const PRODUCT_NOUNS = [
  'Laptop',
  'Phone',
  'Tablet',
  'Camera',
  'Headphones',
  'Speaker',
  'Watch',
  'Keyboard',
  'Mouse',
  'Monitor',
  'Printer',
  'Router',
  'Charger',
  'Case',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

/**
 * Mock data generator class
 */
export class MockDataGenerator {
  private random: SeededRandom;
  private sequenceCounters: Map<string, number> = new Map();

  constructor(seed?: number) {
    this.random = new SeededRandom(seed);
  }

  /**
   * Generate a single value based on mock type and options
   */
  generateValue(
    mockType: MockDataType,
    options: MockDataOptions = {}
  ): unknown {
    switch (mockType) {
      // Personal information
      case 'firstName':
        return this.random.pick(FIRST_NAMES);
      case 'lastName':
        return this.random.pick(LAST_NAMES);
      case 'fullName':
        return `${this.random.pick(FIRST_NAMES)} ${this.random.pick(LAST_NAMES)}`;
      case 'email':
        return this.generateEmail();
      case 'phone':
        return this.generatePhone();
      case 'username':
        return this.generateUsername();
      case 'password':
        return this.generatePassword();
      case 'avatar':
        return `https://i.pravatar.cc/150?u=${this.random.nextInt(1, 1000)}`;

      // Address
      case 'streetAddress':
        return `${this.random.nextInt(1, 9999)} ${this.random.pick(LAST_NAMES)} ${this.random.pick(STREET_SUFFIXES)}`;
      case 'city':
        return this.random.pick(CITIES);
      case 'state':
        return this.random.pick(STATES);
      case 'country':
        return this.random.pick(COUNTRIES);
      case 'zipCode':
        return String(this.random.nextInt(10000, 99999));
      case 'latitude':
        return this.random.nextFloat(-90, 90, 6);
      case 'longitude':
        return this.random.nextFloat(-180, 180, 6);

      // Company
      case 'companyName':
        return `${this.random.pick(COMPANY_NAMES)} ${this.random.pick(COMPANY_SUFFIXES)}`;
      case 'jobTitle':
        return this.random.pick(JOB_TITLES);
      case 'department':
        return this.random.pick(DEPARTMENTS);

      // Internet
      case 'url':
        return `https://www.${this.generateDomain()}/path/${this.random.nextInt(1, 1000)}`;
      case 'domain':
        return this.generateDomain();
      case 'ip':
        return `${this.random.nextInt(1, 255)}.${this.random.nextInt(0, 255)}.${this.random.nextInt(0, 255)}.${this.random.nextInt(1, 255)}`;
      case 'ipv6':
        return this.generateIPv6();
      case 'userAgent':
        return this.random.pick(USER_AGENTS);

      // Text
      case 'sentence':
        return this.generateSentence(
          options.minLength || 5,
          options.maxLength || 15
        );
      case 'paragraph':
        return this.generateParagraph();
      case 'word':
        return this.random.pick(WORDS);
      case 'uuid':
        return this.generateUUID();
      case 'slug':
        return this.generateSlug();

      // Numbers
      case 'integer':
        return this.random.nextInt(options.min ?? 0, options.max ?? 1000);
      case 'float':
        return this.random.nextFloat(
          options.min ?? 0,
          options.max ?? 1000,
          options.precision ?? 2
        );
      case 'boolean':
        return this.random.next() < (options.truePercentage ?? 50) / 100;

      // Date/Time
      case 'date':
        return this.generateDate(options.minDate, options.maxDate);
      case 'datetime':
        return this.generateDateTime(options.minDate, options.maxDate);
      case 'time':
        return this.generateTime();
      case 'timestamp':
        return this.generateTimestamp(options.minDate, options.maxDate);
      case 'pastDate':
        return this.generatePastDate();
      case 'futureDate':
        return this.generateFutureDate();

      // Commerce
      case 'price':
        return this.random.nextFloat(
          options.min ?? 0.99,
          options.max ?? 999.99,
          2
        );
      case 'productName':
        return `${this.random.pick(PRODUCT_ADJECTIVES)} ${this.random.pick(PRODUCT_NOUNS)}`;
      case 'productDescription':
        return this.generateParagraph();

      // Custom types
      case 'enum':
        return options.enumValues?.length
          ? this.random.pick(options.enumValues)
          : null;
      case 'sequence':
        return this.generateSequence(options);
      case 'custom':
        return options.pattern ? this.generateFromPattern(options.pattern) : '';
      case 'null':
        return null;

      default:
        return null;
    }
  }

  /**
   * Generate rows of mock data for a table
   */
  generateRows(columns: ColumnMockConfig[], rowCount: number): GeneratedRow[] {
    const rows: GeneratedRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: GeneratedRow = {};

      for (const col of columns) {
        // Check if this value should be null
        if (col.nullable && this.random.next() * 100 < col.nullPercentage) {
          row[col.columnName] = null;
        } else {
          row[col.columnName] = this.generateValue(col.mockType, col.options);
        }
      }

      rows.push(row);
    }

    return rows;
  }

  /**
   * Generate SQL INSERT statements
   */
  generateInsertSQL(
    tableName: string,
    columns: ColumnMockConfig[],
    rows: GeneratedRow[],
    batchSize: number = 100
  ): string {
    if (rows.length === 0) return '';

    const columnNames = columns
      .map((c) => quoteIdentifier(c.columnName))
      .join(', ');
    const statements: string[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch
        .map((row) => {
          const rowValues = columns
            .map((col) => formatSQLValue(row[col.columnName], col.columnType))
            .join(', ');
          return `(${rowValues})`;
        })
        .join(',\n');

      statements.push(
        `INSERT INTO ${quoteIdentifier(tableName)} (${columnNames})\nVALUES\n${values};`
      );
    }

    return statements.join('\n\n');
  }

  // Private helper methods

  private generateEmail(): string {
    const firstName = this.random
      .pick(FIRST_NAMES)
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const lastName = this.random
      .pick(LAST_NAMES)
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const separator = this.random.pick(['.', '_', '']);
    const number = this.random.next() > 0.5 ? this.random.nextInt(1, 99) : '';
    const domain = this.random.pick(DOMAINS);
    return `${firstName}${separator}${lastName}${number}@${domain}`;
  }

  private generatePhone(): string {
    const formats = [
      '+1 (###) ###-####',
      '(###) ###-####',
      '###-###-####',
      '+86 ### #### ####',
    ];
    return this.generateFromPattern(this.random.pick(formats));
  }

  private generateUsername(): string {
    const firstName = this.random
      .pick(FIRST_NAMES)
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const number = this.random.nextInt(1, 999);
    return `${firstName}${number}`;
  }

  private generatePassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars[this.random.nextInt(0, chars.length - 1)];
    }
    return password;
  }

  private generateDomain(): string {
    const name = this.random.pick(COMPANY_NAMES).toLowerCase();
    const tld = this.random.pick(['com', 'org', 'net', 'io', 'co']);
    return `${name}.${tld}`;
  }

  private generateIPv6(): string {
    const parts: string[] = [];
    for (let i = 0; i < 8; i++) {
      parts.push(this.random.nextInt(0, 65535).toString(16).padStart(4, '0'));
    }
    return parts.join(':');
  }

  private generateSentence(minWords: number, maxWords: number): string {
    const wordCount = this.random.nextInt(minWords, maxWords);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(this.random.pick(WORDS));
    }
    const sentence = words.join(' ');
    return `${sentence.charAt(0).toUpperCase() + sentence.slice(1)}.`;
  }

  private generateParagraph(): string {
    const sentenceCount = this.random.nextInt(3, 6);
    const sentences: string[] = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(this.generateSentence(5, 12));
    }
    return sentences.join(' ');
  }

  private generateUUID(): string {
    const hex = '0123456789abcdef';
    let uuid = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4';
      } else if (i === 19) {
        uuid += hex[this.random.nextInt(8, 11)];
      } else {
        uuid += hex[this.random.nextInt(0, 15)];
      }
    }
    return uuid;
  }

  private generateSlug(): string {
    const wordCount = this.random.nextInt(2, 4);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(this.random.pick(WORDS));
    }
    return words.join('-');
  }

  private generateDate(minDate?: string, maxDate?: string): string {
    const min = minDate
      ? new Date(minDate).getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const max = maxDate ? new Date(maxDate).getTime() : Date.now();
    const timestamp = this.random.nextInt(min, max);
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  private generateDateTime(minDate?: string, maxDate?: string): string {
    const min = minDate
      ? new Date(minDate).getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const max = maxDate ? new Date(maxDate).getTime() : Date.now();
    const timestamp = this.random.nextInt(min, max);
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  private generateTime(): string {
    const hours = this.random.nextInt(0, 23).toString().padStart(2, '0');
    const minutes = this.random.nextInt(0, 59).toString().padStart(2, '0');
    const seconds = this.random.nextInt(0, 59).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private generateTimestamp(minDate?: string, maxDate?: string): number {
    const min = minDate
      ? new Date(minDate).getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const max = maxDate ? new Date(maxDate).getTime() : Date.now();
    return this.random.nextInt(min, max);
  }

  private generatePastDate(): string {
    const daysAgo = this.random.nextInt(1, 365);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  private generateFutureDate(): string {
    const daysAhead = this.random.nextInt(1, 365);
    const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  private generateSequence(options: MockDataOptions): string | number {
    const key = `${options.prefix || ''}${options.suffix || ''}`;
    const current = this.sequenceCounters.get(key) ?? options.startValue ?? 1;
    this.sequenceCounters.set(key, current + (options.step ?? 1));

    if (options.prefix || options.suffix) {
      return `${options.prefix || ''}${current}${options.suffix || ''}`;
    }
    return current;
  }

  private generateFromPattern(pattern: string): string {
    return pattern.replace(/#/g, () => String(this.random.nextInt(0, 9)));
  }
}

/**
 * Suggest mock type based on column name and SQL type
 */
export function suggestMockType(column: ColumnSchema): MockTypeSuggestion {
  const name = column.name.toLowerCase();
  const type = column.type.toLowerCase();

  // Check for common patterns in column name
  const patterns: [RegExp, MockDataType, number, string][] = [
    // Personal info
    [
      /^(first_?name|fname|given_?name)$/i,
      'firstName',
      0.95,
      'Column name matches first name pattern',
    ],
    [
      /^(last_?name|lname|surname|family_?name)$/i,
      'lastName',
      0.95,
      'Column name matches last name pattern',
    ],
    [
      /^(full_?name|name|display_?name)$/i,
      'fullName',
      0.85,
      'Column name matches full name pattern',
    ],
    [/email/i, 'email', 0.95, 'Column name contains "email"'],
    [
      /^(phone|tel|mobile|cell)/i,
      'phone',
      0.9,
      'Column name matches phone pattern',
    ],
    [
      /^(user_?name|login|account)$/i,
      'username',
      0.85,
      'Column name matches username pattern',
    ],
    [/password|pwd|pass/i, 'password', 0.9, 'Column name contains "password"'],
    [
      /avatar|profile_?(pic|image|photo)/i,
      'avatar',
      0.9,
      'Column name matches avatar pattern',
    ],

    // Address
    [
      /^(street|address|addr)/i,
      'streetAddress',
      0.85,
      'Column name matches street address pattern',
    ],
    [/^city$/i, 'city', 0.95, 'Column name is "city"'],
    [
      /^(state|province|region)$/i,
      'state',
      0.9,
      'Column name matches state/province pattern',
    ],
    [/^country$/i, 'country', 0.95, 'Column name is "country"'],
    [
      /^(zip|postal|postcode)/i,
      'zipCode',
      0.9,
      'Column name matches zip code pattern',
    ],
    [
      /^(lat|latitude)$/i,
      'latitude',
      0.95,
      'Column name matches latitude pattern',
    ],
    [
      /^(lng|lon|longitude)$/i,
      'longitude',
      0.95,
      'Column name matches longitude pattern',
    ],

    // Company
    [/^company/i, 'companyName', 0.85, 'Column name starts with "company"'],
    [
      /^(job_?title|title|position|role)$/i,
      'jobTitle',
      0.85,
      'Column name matches job title pattern',
    ],
    [
      /^(department|dept)$/i,
      'department',
      0.9,
      'Column name matches department pattern',
    ],

    // Internet
    [
      /^(url|link|website|homepage)/i,
      'url',
      0.9,
      'Column name matches URL pattern',
    ],
    [/^(domain|host)/i, 'domain', 0.85, 'Column name matches domain pattern'],
    [/^ip(_?address)?$/i, 'ip', 0.9, 'Column name matches IP address pattern'],
    [
      /user_?agent/i,
      'userAgent',
      0.9,
      'Column name matches user agent pattern',
    ],

    // IDs
    [/^(uuid|guid)$/i, 'uuid', 0.95, 'Column name is UUID/GUID'],
    [/^id$/i, 'sequence', 0.7, 'Column name is "id"'],
    [/_id$/i, 'integer', 0.6, 'Column name ends with "_id"'],

    // Dates
    [
      /^(created|updated|modified)(_at|_date|_time)?$/i,
      'datetime',
      0.85,
      'Column name matches timestamp pattern',
    ],
    [/date$/i, 'date', 0.8, 'Column name ends with "date"'],
    [/time$/i, 'time', 0.8, 'Column name ends with "time"'],
    [/timestamp/i, 'timestamp', 0.9, 'Column name contains "timestamp"'],

    // Commerce
    [
      /^price|cost|amount|total/i,
      'price',
      0.85,
      'Column name matches price pattern',
    ],
    [
      /^product_?name$/i,
      'productName',
      0.9,
      'Column name matches product name pattern',
    ],
    [
      /^(description|desc|summary|content|body|text)$/i,
      'paragraph',
      0.75,
      'Column name matches description pattern',
    ],

    // Text
    [/^slug$/i, 'slug', 0.95, 'Column name is "slug"'],
    [
      /^(title|headline|subject)$/i,
      'sentence',
      0.7,
      'Column name matches title pattern',
    ],
  ];

  for (const [pattern, mockType, confidence, reason] of patterns) {
    if (pattern.test(name)) {
      return { mockType, confidence, reason };
    }
  }

  // Fall back to SQL type matching
  if (/integer|int|serial/i.test(type)) {
    return {
      mockType: 'integer',
      confidence: 0.6,
      reason: 'SQL type is integer',
    };
  }
  if (/float|double|decimal|real|numeric/i.test(type)) {
    return {
      mockType: 'float',
      confidence: 0.6,
      reason: 'SQL type is floating point',
    };
  }
  if (/bool/i.test(type)) {
    return {
      mockType: 'boolean',
      confidence: 0.9,
      reason: 'SQL type is boolean',
    };
  }
  if (/date/i.test(type)) {
    return { mockType: 'date', confidence: 0.8, reason: 'SQL type is date' };
  }
  if (/time/i.test(type)) {
    if (/timestamp/i.test(type)) {
      return {
        mockType: 'datetime',
        confidence: 0.85,
        reason: 'SQL type is timestamp',
      };
    }
    return { mockType: 'time', confidence: 0.8, reason: 'SQL type is time' };
  }
  if (/text|clob/i.test(type)) {
    return {
      mockType: 'paragraph',
      confidence: 0.5,
      reason: 'SQL type is text',
    };
  }
  if (/char|varchar|string/i.test(type)) {
    return { mockType: 'word', confidence: 0.3, reason: 'SQL type is string' };
  }
  if (/uuid/i.test(type)) {
    return { mockType: 'uuid', confidence: 0.95, reason: 'SQL type is UUID' };
  }
  if (/json/i.test(type)) {
    return {
      mockType: 'sentence',
      confidence: 0.3,
      reason: 'SQL type is JSON',
    };
  }
  if (/blob|binary/i.test(type)) {
    return {
      mockType: 'null',
      confidence: 0.5,
      reason: 'SQL type is binary (not supported)',
    };
  }

  return { mockType: 'word', confidence: 0.2, reason: 'Default fallback' };
}

/**
 * Quote identifier for SQL safety
 */
function quoteIdentifier(identifier: string): string {
  if (/^[a-z_]\w*$/i.test(identifier)) {
    return identifier;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Format value for SQL INSERT statement
 */
function formatSQLValue(value: unknown, columnType: string): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    // Different databases handle booleans differently
    if (/bool/i.test(columnType)) {
      return value ? 'TRUE' : 'FALSE';
    }
    return value ? '1' : '0';
  }

  // String values need escaping
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Get all available mock data types with descriptions
 */
export function getMockDataTypes(): {
  value: MockDataType;
  label: string;
  category: string;
}[] {
  return [
    // Personal
    { value: 'firstName', label: 'First Name', category: 'Personal' },
    { value: 'lastName', label: 'Last Name', category: 'Personal' },
    { value: 'fullName', label: 'Full Name', category: 'Personal' },
    { value: 'email', label: 'Email', category: 'Personal' },
    { value: 'phone', label: 'Phone', category: 'Personal' },
    { value: 'username', label: 'Username', category: 'Personal' },
    { value: 'password', label: 'Password', category: 'Personal' },
    { value: 'avatar', label: 'Avatar URL', category: 'Personal' },

    // Address
    { value: 'streetAddress', label: 'Street Address', category: 'Address' },
    { value: 'city', label: 'City', category: 'Address' },
    { value: 'state', label: 'State/Province', category: 'Address' },
    { value: 'country', label: 'Country', category: 'Address' },
    { value: 'zipCode', label: 'Zip Code', category: 'Address' },
    { value: 'latitude', label: 'Latitude', category: 'Address' },
    { value: 'longitude', label: 'Longitude', category: 'Address' },

    // Company
    { value: 'companyName', label: 'Company Name', category: 'Company' },
    { value: 'jobTitle', label: 'Job Title', category: 'Company' },
    { value: 'department', label: 'Department', category: 'Company' },

    // Internet
    { value: 'url', label: 'URL', category: 'Internet' },
    { value: 'domain', label: 'Domain', category: 'Internet' },
    { value: 'ip', label: 'IP Address', category: 'Internet' },
    { value: 'ipv6', label: 'IPv6 Address', category: 'Internet' },
    { value: 'userAgent', label: 'User Agent', category: 'Internet' },

    // Text
    { value: 'word', label: 'Word', category: 'Text' },
    { value: 'sentence', label: 'Sentence', category: 'Text' },
    { value: 'paragraph', label: 'Paragraph', category: 'Text' },
    { value: 'uuid', label: 'UUID', category: 'Text' },
    { value: 'slug', label: 'Slug', category: 'Text' },

    // Numbers
    { value: 'integer', label: 'Integer', category: 'Numbers' },
    { value: 'float', label: 'Float', category: 'Numbers' },
    { value: 'boolean', label: 'Boolean', category: 'Numbers' },

    // Date/Time
    { value: 'date', label: 'Date', category: 'Date/Time' },
    { value: 'datetime', label: 'DateTime', category: 'Date/Time' },
    { value: 'time', label: 'Time', category: 'Date/Time' },
    { value: 'timestamp', label: 'Timestamp', category: 'Date/Time' },
    { value: 'pastDate', label: 'Past Date', category: 'Date/Time' },
    { value: 'futureDate', label: 'Future Date', category: 'Date/Time' },

    // Commerce
    { value: 'price', label: 'Price', category: 'Commerce' },
    { value: 'productName', label: 'Product Name', category: 'Commerce' },
    {
      value: 'productDescription',
      label: 'Product Description',
      category: 'Commerce',
    },

    // Custom
    { value: 'enum', label: 'Enum Values', category: 'Custom' },
    { value: 'sequence', label: 'Sequence', category: 'Custom' },
    { value: 'custom', label: 'Custom Pattern', category: 'Custom' },
    { value: 'null', label: 'NULL', category: 'Custom' },
  ];
}
