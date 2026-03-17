import type { TableSchema } from '@/types/database';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SchemaDetailsPanel } from './SchemaDetailsPanel';

const mockTable: TableSchema = {
  name: 'test_table',
  schema: 'main',
  type: 'table',
  columns: [
    { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
    { name: 'name', type: 'TEXT', nullable: false, isPrimaryKey: false },
  ],
  primaryKey: ['id'], // Added primaryKey
  indexes: [],
  foreignKeys: [],
  triggers: [],
  sql: 'CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)',
};

describe('schemaDetailsPanel', () => {
  it('should render close button with accessible name when table is present', () => {
    render(<SchemaDetailsPanel table={mockTable} onClose={vi.fn()} />);
    const closeButton = screen.getByRole('button', { name: /common.close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should render close button with accessible name when table is NOT present', () => {
    render(<SchemaDetailsPanel table={null} onClose={vi.fn()} />);
    const closeButton = screen.getByRole('button', { name: /common.close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should render section toggle buttons with aria-expanded', () => {
    render(<SchemaDetailsPanel table={mockTable} onClose={vi.fn()} />);

    // The section button includes text "Columns (2)" because count is 2
    // We can search by partial text
    const columnsToggle = screen.getByRole('button', { name: /schema.columns/i });
    expect(columnsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(columnsToggle).toHaveAttribute('aria-controls', 'section-columns-content');
  });
});
