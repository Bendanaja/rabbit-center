'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Pagination
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  // Row click
  onRowClick?: (row: T) => void;
  // Empty state
  emptyMessage?: string;
}

export function AdminTable<T>({
  columns,
  data,
  loading,
  sortBy,
  sortOrder,
  onSort,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  selectable,
  selectedIds = [],
  onSelectionChange,
  getRowId,
  onRowClick,
  emptyMessage = 'ไม่พบข้อมูล',
}: AdminTableProps<T>) {
  const handleSelectAll = () => {
    if (!getRowId || !onSelectionChange) return;

    const allIds = data.map(row => getRowId(row));
    const allSelected = allIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    }
  };

  const handleSelectRow = (rowId: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(rowId)) {
      onSelectionChange(selectedIds.filter(id => id !== rowId));
    } else {
      onSelectionChange([...selectedIds, rowId]);
    }
  };

  const allSelected = data.length > 0 && getRowId
    ? data.every(row => selectedIds.includes(getRowId(row)))
    : false;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500/50"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:text-white transition-colors'
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <span className="text-neutral-600">
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            <AnimatePresence mode="wait">
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      {selectable && (
                        <td className="px-4 py-3">
                          <div className="h-4 w-4 bg-neutral-800 rounded" />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          <div className="h-4 bg-neutral-800 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <p className="text-neutral-400">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const rowId = getRowId ? getRowId(row) : String(index);
                  const isSelected = selectedIds.includes(rowId);

                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'transition-colors',
                        isSelected && 'bg-primary-500/10',
                        onRowClick && 'cursor-pointer hover:bg-neutral-800/50'
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectRow(rowId);
                            }}
                            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500/50"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-sm text-neutral-300"
                        >
                          {column.render
                            ? column.render(row, index)
                            : String((row as Record<string, unknown>)[column.key] || '-')}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
          <p className="text-sm text-neutral-400">
            แสดง {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} จาก {total} รายการ
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                page <= 1
                  ? 'text-neutral-600 cursor-not-allowed'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm transition-colors',
                    pageNum === page
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                page >= totalPages
                  ? 'text-neutral-600 cursor-not-allowed'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
