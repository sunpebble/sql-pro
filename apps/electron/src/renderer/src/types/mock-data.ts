// Mock data generator types

// Supported faker data types for generating mock data
export type MockDataType =
  // Personal information
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'username'
  | 'password'
  | 'avatar'
  // Address
  | 'streetAddress'
  | 'city'
  | 'state'
  | 'country'
  | 'zipCode'
  | 'latitude'
  | 'longitude'
  // Company
  | 'companyName'
  | 'jobTitle'
  | 'department'
  // Internet
  | 'url'
  | 'domain'
  | 'ip'
  | 'ipv6'
  | 'userAgent'
  // Text
  | 'sentence'
  | 'paragraph'
  | 'word'
  | 'uuid'
  | 'slug'
  // Numbers
  | 'integer'
  | 'float'
  | 'boolean'
  // Date/Time
  | 'date'
  | 'datetime'
  | 'time'
  | 'timestamp'
  | 'pastDate'
  | 'futureDate'
  // Commerce
  | 'price'
  | 'productName'
  | 'productDescription'
  // Custom
  | 'custom'
  | 'enum'
  | 'sequence'
  | 'null';

// Configuration for a column's mock data generation
export interface ColumnMockConfig {
  columnName: string;
  columnType: string; // Original SQL type
  mockType: MockDataType;
  nullable: boolean;
  nullPercentage: number; // 0-100, percentage of null values
  // Type-specific options
  options?: MockDataOptions;
}

// Options for different mock data types
export interface MockDataOptions {
  // For integer/float
  min?: number;
  max?: number;
  precision?: number;

  // For enum type
  enumValues?: string[];

  // For sequence type
  startValue?: number;
  step?: number;
  prefix?: string;
  suffix?: string;

  // For custom regex
  pattern?: string;

  // For date types
  minDate?: string;
  maxDate?: string;
  dateFormat?: string;

  // For text types
  minLength?: number;
  maxLength?: number;

  // For boolean
  truePercentage?: number;
}

// Table mock data configuration
export interface TableMockConfig {
  tableName: string;
  schemaName: string;
  rowCount: number;
  columns: ColumnMockConfig[];
  // Batch insert size for performance
  batchSize: number;
  // Whether to truncate table before inserting
  truncateFirst: boolean;
  // Whether to respect foreign key constraints
  respectForeignKeys: boolean;
}

// Generated row data
export interface GeneratedRow {
  [columnName: string]: unknown;
}

// Mock data generation result
export interface MockDataResult {
  success: boolean;
  rowsGenerated: number;
  sql?: string;
  error?: string;
  previewData?: GeneratedRow[];
}

// Column type to mock type mapping suggestion
export interface MockTypeSuggestion {
  mockType: MockDataType;
  confidence: number; // 0-1
  reason: string;
}
