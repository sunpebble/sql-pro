import type { Variants } from 'framer-motion';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Download } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
}

interface ResizableTableProps {
  title?: string;
  employees?: Employee[];
  onEmployeeSelect?: (employeeId: string) => void;
  onColumnResize?: (columnKey: string, newWidth: number) => void;
  className?: string;
  enableAnimations?: boolean;
}

const defaultEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    salary: 125000,
    hireDate: '2022-03-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    salary: 95000,
    hireDate: '2021-08-22',
    status: 'active',
  },
  {
    id: '3',
    name: 'Emily Watson',
    email: 'emily.watson@company.com',
    department: 'Design',
    position: 'UX Designer',
    salary: 88000,
    hireDate: '2023-01-10',
    status: 'active',
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    department: 'Engineering',
    position: 'Tech Lead',
    salary: 145000,
    hireDate: '2020-11-05',
    status: 'active',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    department: 'HR',
    position: 'HR Director',
    salary: 110000,
    hireDate: '2019-06-12',
    status: 'on-leave',
  },
  {
    id: '6',
    name: 'James Mitchell',
    email: 'james.mitchell@company.com',
    department: 'Sales',
    position: 'Sales Director',
    salary: 130000,
    hireDate: '2021-02-28',
    status: 'active',
  },
  {
    id: '7',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 75000,
    hireDate: '2023-04-18',
    status: 'active',
  },
  {
    id: '8',
    name: 'Robert Chang',
    email: 'robert.chang@company.com',
    department: 'Engineering',
    position: 'DevOps Engineer',
    salary: 105000,
    hireDate: '2022-09-14',
    status: 'active',
  },
  {
    id: '9',
    name: 'Amanda Pierce',
    email: 'amanda.pierce@company.com',
    department: 'Marketing',
    position: 'Content Manager',
    salary: 72000,
    hireDate: '2023-07-03',
    status: 'inactive',
  },
  {
    id: '10',
    name: 'Christopher Hayes',
    email: 'chris.hayes@company.com',
    department: 'Operations',
    position: 'Operations Manager',
    salary: 98000,
    hireDate: '2021-12-01',
    status: 'active',
  },
  {
    id: '11',
    name: 'Victoria Moore',
    email: 'victoria.moore@company.com',
    department: 'Design',
    position: 'Product Designer',
    salary: 92000,
    hireDate: '2022-05-20',
    status: 'active',
  },
  {
    id: '12',
    name: 'Nicholas Brown',
    email: 'nicholas.brown@company.com',
    department: 'Engineering',
    position: 'Frontend Developer',
    salary: 85000,
    hireDate: '2023-03-08',
    status: 'active',
  },
  {
    id: '13',
    name: 'Rebecca Sullivan',
    email: 'rebecca.sullivan@company.com',
    department: 'Sales',
    position: 'Account Executive',
    salary: 78000,
    hireDate: '2022-11-15',
    status: 'active',
  },
  {
    id: '14',
    name: 'Thomas Wright',
    email: 'thomas.wright@company.com',
    department: 'Finance',
    position: 'Senior Financial Analyst',
    salary: 95000,
    hireDate: '2021-04-30',
    status: 'active',
  },
  {
    id: '15',
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    department: 'HR',
    position: 'HR Specialist',
    salary: 68000,
    hireDate: '2023-08-12',
    status: 'active',
  },
];

type SortField = 'name' | 'department' | 'position' | 'salary' | 'hireDate';
type SortOrder = 'asc' | 'desc';

export function ResizableTable({
  title = 'Employee',
  employees: initialEmployees = defaultEmployees,
  onEmployeeSelect,
  onColumnResize,
  className = '',
  enableAnimations = true,
}: ResizableTableProps = {}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  // Column width state with default values
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    name: 200,
    email: 220,
    department: 140,
    position: 180,
    salary: 120,
    hireDate: 120,
    status: 100,
  });

  const ITEMS_PER_PAGE = 10;

  // Subscribe to dark mode changes using useSyncExternalStore
  const isDark = useSyncExternalStore(
    (callback) => {
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => false // Server-side snapshot
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional mount state for hydration/SSR safety
    setMounted(true);
  }, []);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
    if (onEmployeeSelect) {
      onEmployeeSelect(employeeId);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const sortedEmployees = useMemo(() => {
    if (!sortField) {
      return initialEmployees;
    }

    return [...initialEmployees].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === 'hireDate') {
        aVal = new Date(a.hireDate).getTime();
        bVal = new Date(b.hireDate).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [initialEmployees, sortField, sortOrder]);

  const paginatedEmployees = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEmployees.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedEmployees, currentPage]);

  const handleSelectAll = () => {
    if (selectedEmployees.length === paginatedEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(paginatedEmployees.map((e) => e.id));
    }
  };

  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    if (!mounted) {
      const statusMap: Record<
        string,
        {
          bgColor: string;
          borderColor: string;
          textColor: string;
          dotColor: string;
        }
      > = {
        active: {
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          dotColor: 'bg-green-400',
        },
        inactive: {
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          dotColor: 'bg-red-400',
        },
        'on-leave': {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          dotColor: 'bg-yellow-400',
        },
      };
      return statusMap[status];
    }

    const statusMap: Record<
      string,
      {
        bgColor: string;
        borderColor: string;
        textColor: string;
        dotColor: string;
      }
    > = {
      active: {
        bgColor: isDark ? 'bg-green-500/10' : 'bg-green-50',
        borderColor: isDark ? 'border-green-500/30' : 'border-green-200',
        textColor: isDark ? 'text-green-400' : 'text-green-600',
        dotColor: isDark ? 'bg-green-400' : 'bg-green-600',
      },
      inactive: {
        bgColor: isDark ? 'bg-red-500/10' : 'bg-red-50',
        borderColor: isDark ? 'border-red-500/30' : 'border-red-200',
        textColor: isDark ? 'text-red-400' : 'text-red-600',
        dotColor: isDark ? 'bg-red-400' : 'bg-red-600',
      },
      'on-leave': {
        bgColor: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
        borderColor: isDark ? 'border-yellow-500/30' : 'border-yellow-200',
        textColor: isDark ? 'text-yellow-400' : 'text-yellow-600',
        dotColor: isDark ? 'bg-yellow-400' : 'bg-yellow-600',
      },
    };

    return statusMap[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleResize = (
    columnKey: string,
    { size }: { size: { width: number } }
  ) => {
    const newWidth = Math.max(80, Math.min(400, size.width));

    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: newWidth,
    }));

    if (onColumnResize) {
      onColumnResize(columnKey, newWidth);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Department',
      'Position',
      'Salary',
      'Hire Date',
      'Status',
    ];
    const rows = sortedEmployees.map((employee) => [
      employee.name,
      employee.email,
      employee.department,
      employee.position,
      employee.salary,
      employee.hireDate,
      employee.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(sortedEmployees, null, 2);
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants: Variants = {
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  };

  const rowVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className={`mx-auto w-full max-w-7xl ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"></div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="bg-background border-border/50 text-foreground hover:bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 6L6 3L9 6M6 3V13M13 10L10 13L7 10M10 13V3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sort{' '}
              {sortField && (
                <span className="bg-primary text-primary-foreground ml-1 rounded-sm px-1.5 py-0.5 text-xs">
                  1
                </span>
              )}
              <ChevronDown size={14} className="opacity-50" />
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="bg-background border-border/50 absolute right-0 z-20 mt-1 w-48 rounded-md border py-1 shadow-lg">
                  <button
                    onClick={() => handleSort('name')}
                    className={`hover:bg-muted/50 w-full px-3 py-2 text-left text-sm transition-colors ${sortField === 'name' ? 'bg-muted/30' : ''}`}
                  >
                    Name{' '}
                    {sortField === 'name' &&
                      `(${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`}
                  </button>
                  <button
                    onClick={() => handleSort('department')}
                    className={`hover:bg-muted/50 w-full px-3 py-2 text-left text-sm transition-colors ${sortField === 'department' ? 'bg-muted/30' : ''}`}
                  >
                    Department{' '}
                    {sortField === 'department' &&
                      `(${sortOrder === 'asc' ? '↑' : '↓'})`}
                  </button>
                  <button
                    onClick={() => handleSort('salary')}
                    className={`hover:bg-muted/50 w-full px-3 py-2 text-left text-sm transition-colors ${sortField === 'salary' ? 'bg-muted/30' : ''}`}
                  >
                    Salary{' '}
                    {sortField === 'salary' &&
                      `(${sortOrder === 'asc' ? '↑' : '↓'})`}
                  </button>
                  <button
                    onClick={() => handleSort('hireDate')}
                    className={`hover:bg-muted/50 w-full px-3 py-2 text-left text-sm transition-colors ${sortField === 'hireDate' ? 'bg-muted/30' : ''}`}
                  >
                    Hire Date{' '}
                    {sortField === 'hireDate' &&
                      `(${sortOrder === 'asc' ? '↑' : '↓'})`}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-background border-border/50 text-foreground hover:bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
            >
              <Download size={14} />
              Export
              <ChevronDown size={14} className="opacity-50" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="bg-background border-border/50 absolute right-0 z-20 mt-1 w-32 rounded-md border shadow-lg">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToJSON();
                      setShowExportMenu(false);
                    }}
                    className="border-border/30 hover:bg-muted/50 flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm transition-colors"
                  >
                    JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background border-border/50 relative overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="text-muted-foreground/60 bg-muted/5 border-border flex border-b py-3 text-xs font-medium">
              <div
                className="border-border flex items-center justify-center border-r pr-3"
                style={{ width: columnWidths.checkbox }}
              >
                <input
                  type="checkbox"
                  className="border-border/40 h-4 w-4 cursor-pointer rounded-md"
                  style={
                    mounted
                      ? {
                          accentColor: isDark
                            ? 'rgb(113, 113, 122)'
                            : 'rgb(161, 161, 170)',
                        }
                      : {}
                  }
                  checked={
                    paginatedEmployees.length > 0 &&
                    selectedEmployees.length === paginatedEmployees.length
                  }
                  onChange={handleSelectAll}
                />
              </div>

              <Resizable
                width={columnWidths.name}
                height={0}
                onResize={(_e, data) => handleResize('name', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center border-r px-3"
                  style={{ width: columnWidths.name }}
                >
                  <span>{title}</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.email}
                height={0}
                onResize={(_e, data) => handleResize('email', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center gap-1.5 border-r px-3"
                  style={{ width: columnWidths.email }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="opacity-40"
                  >
                    <rect
                      x="2"
                      y="4"
                      width="12"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M2 6L8 9L14 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span>Email</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.department}
                height={0}
                onResize={(_e, data) => handleResize('department', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center gap-1.5 border-r px-3"
                  style={{ width: columnWidths.department }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="opacity-40"
                  >
                    <path
                      d="M2 2H4M2 8H6M2 14H8M10 2V14M14 4V14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Department</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.position}
                height={0}
                onResize={(_e, data) => handleResize('position', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center gap-1.5 border-r px-3"
                  style={{ width: columnWidths.position }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="opacity-40"
                  >
                    <path
                      d="M3 3H13M3 8H13M3 13H9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Position</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.salary}
                height={0}
                onResize={(_e, data) => handleResize('salary', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center gap-1.5 border-r px-3"
                  style={{ width: columnWidths.salary }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="opacity-40"
                  >
                    <path
                      d="M8 1L3 9H7L8 15L13 7H9L8 1Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Salary</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.hireDate}
                height={0}
                onResize={(_e, data) => handleResize('hireDate', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={
                  <div className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-transparent transition-all hover:w-1.5" />
                }
              >
                <div
                  className="border-border relative flex items-center gap-1.5 border-r px-3"
                  style={{ width: columnWidths.hireDate }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="opacity-40"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="12"
                      height="10"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M6 1V3M10 1V3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Hire Date</span>
                </div>
              </Resizable>

              <div
                className="flex items-center gap-1.5 px-3"
                style={{ width: columnWidths.status }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="opacity-40"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M8 4V8L10 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Status</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                variants={shouldAnimate ? containerVariants : {}}
                initial={shouldAnimate ? 'hidden' : 'visible'}
                animate="visible"
              >
                {paginatedEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    variants={shouldAnimate ? rowVariants : {}}
                  >
                    <div
                      className={`border-border group relative flex border-b py-3.5 transition-all duration-150 ${
                        selectedEmployees.includes(employee.id)
                          ? 'bg-muted/30'
                          : 'bg-muted/5 hover:bg-muted/20'
                      }`}
                    >
                      <div
                        className="border-border flex items-center justify-center border-r pr-3"
                        style={{ width: columnWidths.checkbox }}
                      >
                        <input
                          type="checkbox"
                          className="border-border/40 h-4 w-4 cursor-pointer rounded-md"
                          style={
                            mounted
                              ? {
                                  accentColor: isDark
                                    ? 'rgb(113, 113, 122)'
                                    : 'rgb(161, 161, 170)',
                                }
                              : {}
                          }
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeSelect(employee.id)}
                        />
                      </div>

                      <div
                        className="border-border flex min-w-0 items-center border-r px-3"
                        style={{ width: columnWidths.name }}
                      >
                        <span className="text-foreground truncate text-sm">
                          {employee.name}
                        </span>
                      </div>

                      <div
                        className="border-border flex min-w-0 items-center border-r px-3"
                        style={{ width: columnWidths.email }}
                      >
                        <a
                          href={`mailto:${employee.email}`}
                          className="truncate text-sm text-blue-500 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {employee.email}
                        </a>
                      </div>

                      <div
                        className="border-border flex items-center border-r px-3"
                        style={{ width: columnWidths.department }}
                      >
                        <span className="text-foreground/80 truncate text-sm">
                          {employee.department}
                        </span>
                      </div>

                      <div
                        className="border-border flex min-w-0 items-center border-r px-3"
                        style={{ width: columnWidths.position }}
                      >
                        <span className="text-foreground/80 truncate text-sm">
                          {employee.position}
                        </span>
                      </div>

                      <div
                        className="border-border flex items-center border-r px-3"
                        style={{ width: columnWidths.salary }}
                      >
                        <span className="text-foreground/90 text-sm font-semibold">
                          {formatCurrency(employee.salary)}
                        </span>
                      </div>

                      <div
                        className="border-border flex items-center border-r px-3"
                        style={{ width: columnWidths.hireDate }}
                      >
                        <span className="text-foreground/80 text-sm">
                          {formatDate(employee.hireDate)}
                        </span>
                      </div>

                      <div
                        className="flex items-center px-3"
                        style={{ width: columnWidths.status }}
                      >
                        {(() => {
                          const { bgColor, textColor, dotColor } =
                            getStatusColor(employee.status);
                          return (
                            <div
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${bgColor} ${textColor}`}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                              ></div>
                              {employee.status.charAt(0).toUpperCase() +
                                employee.status.slice(1).replace('-', ' ')}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-muted-foreground/70 text-xs">
            Page {currentPage} of {totalPages} • {sortedEmployees.length}{' '}
            employees
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-background border-border/50 text-foreground hover:bg-muted/30 rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="bg-background border-border/50 text-foreground hover:bg-muted/30 rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
