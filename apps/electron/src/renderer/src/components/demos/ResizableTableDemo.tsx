/**
 * ResizableTable Demo Component
 *
 * This demo showcases the ResizableTable component with all its features:
 * - Resizable columns with drag handles
 * - Sorting by clicking column headers
 * - Pagination with configurable page sizes
 * - Row selection with checkboxes
 * - Export to CSV functionality
 * - Animated row transitions using framer-motion
 * - Dark/light theme support
 */

import type { Employee } from '@sqlpro/ui';
import { ResizableTable } from '@sqlpro/ui';

// Sample employee data for demonstration
const sampleEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    department: 'Engineering',
    position: 'Senior Developer',
    salary: 120000,
    hireDate: '2020-03-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    salary: 95000,
    hireDate: '2019-07-22',
    status: 'active',
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 85000,
    hireDate: '2021-01-10',
    status: 'on-leave',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    department: 'Engineering',
    position: 'Junior Developer',
    salary: 70000,
    hireDate: '2022-06-01',
    status: 'active',
  },
  {
    id: '5',
    name: 'Eva Martinez',
    email: 'eva@example.com',
    department: 'HR',
    position: 'HR Specialist',
    salary: 75000,
    hireDate: '2020-09-14',
    status: 'active',
  },
  {
    id: '6',
    name: 'Frank Lee',
    email: 'frank@example.com',
    department: 'Engineering',
    position: 'Tech Lead',
    salary: 140000,
    hireDate: '2018-04-20',
    status: 'active',
  },
  {
    id: '7',
    name: 'Grace Chen',
    email: 'grace@example.com',
    department: 'Design',
    position: 'UX Designer',
    salary: 90000,
    hireDate: '2021-03-08',
    status: 'inactive',
  },
  {
    id: '8',
    name: 'Henry Wilson',
    email: 'henry@example.com',
    department: 'Sales',
    position: 'Sales Representative',
    salary: 65000,
    hireDate: '2022-01-15',
    status: 'active',
  },
  {
    id: '9',
    name: 'Iris Taylor',
    email: 'iris@example.com',
    department: 'Engineering',
    position: 'DevOps Engineer',
    salary: 115000,
    hireDate: '2019-11-01',
    status: 'active',
  },
  {
    id: '10',
    name: 'Jack Anderson',
    email: 'jack@example.com',
    department: 'Marketing',
    position: 'Content Writer',
    salary: 60000,
    hireDate: '2022-08-22',
    status: 'on-leave',
  },
  {
    id: '11',
    name: 'Karen Thomas',
    email: 'karen@example.com',
    department: 'Finance',
    position: 'Senior Accountant',
    salary: 95000,
    hireDate: '2017-05-30',
    status: 'active',
  },
  {
    id: '12',
    name: 'Leo Garcia',
    email: 'leo@example.com',
    department: 'Engineering',
    position: 'Mobile Developer',
    salary: 105000,
    hireDate: '2020-12-07',
    status: 'active',
  },
];

/**
 * Demo wrapper for ResizableTable
 * Displays a fully functional table with sample employee data
 */
export function ResizableTableDemo() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">ResizableTable Demo</h1>
        <p className="text-muted-foreground text-sm">
          A fully-featured data table with resizable columns, sorting,
          pagination, and row selection.
        </p>
      </div>

      <div className="bg-card flex-1 overflow-hidden rounded-lg border shadow-sm">
        <ResizableTable employees={sampleEmployees} title="Employees" />
      </div>
    </div>
  );
}

export default ResizableTableDemo;
