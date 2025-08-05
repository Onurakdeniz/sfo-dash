import * as React from "react"
import { ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, ArrowUpDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Badge } from "./badge"
import { Checkbox } from "./checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

const dataTableVariants = cva(
  "w-full border-collapse bg-card text-card-foreground rounded-lg border overflow-hidden",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        bordered: "border-2",
        striped: "[&_tbody_tr:nth-child(even)]:bg-muted/30",
        hoverable: "[&_tbody_tr]:hover:bg-muted/50 [&_tbody_tr]:transition-colors",
        compact: "[&_td]:py-2 [&_th]:py-2",
      },
      size: {
        sm: "[&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1 text-sm",
        default: "[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3",
        lg: "[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> extends VariantProps<typeof dataTableVariants> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  className?: string
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  selectable = false,
  pagination = false,
  pageSize = 10,
  variant,
  size,
  className,
  onRowClick,
  onSelectionChange,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | string
    direction: "asc" | "desc"
  } | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<T[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data

    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key as keyof T]
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, columns])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T]
      const bValue = b[sortConfig.key as keyof T]

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (key: keyof T | string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc"
          ? { key, direction: "desc" }
          : null
      }
      return { key, direction: "asc" }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedRows([])
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelectedRows = checked
      ? [...selectedRows, row]
      : selectedRows.filter((r) => r !== row)
    
    setSelectedRows(newSelectedRows)
    onSelectionChange?.(newSelectedRows)
  }

  const isRowSelected = (row: T) => selectedRows.includes(row)
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(isRowSelected)
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className={cn(dataTableVariants({ variant, size }), className)}>
          <thead className="bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate ? true : undefined}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "text-left font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer hover:text-foreground",
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "border-t",
                  onRowClick && "cursor-pointer",
                  isRowSelected(row) && "bg-primary/5"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td>
                    <Checkbox
                      checked={isRowSelected(row)}
                      onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={String(column.key)} className="text-sm">
                    {column.render
                      ? column.render(row[column.key as keyof T], row)
                      : String(row[column.key as keyof T] || "")}
                  </td>
                ))}
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { dataTableVariants }