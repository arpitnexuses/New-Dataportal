"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
  HeaderGroup,
  Row,
  Cell,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MoreHorizontal, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddFileForm } from "./add-file-form"
import Image from "next/image"
import { AddCreditsDialog } from "./add-credits-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"

interface FileInfo {
  id: string
  title: string
  filename: string
  originalName: string
  recordCount: number
  columnCount: number
  createdAt: string
}

interface User {
  id: string
  email: string
  role: string
  userType?: string
  title?: string
  credits: number
  totalFiles: number
  totalRecords: number
  lastUpload: string | null
  createdAt: string
  files: FileInfo[]
}

export interface UserListRef {
  refreshUsers: () => void
}

export const UserList = forwardRef<UserListRef>((_, ref) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Expose the refresh function through the ref
  useImperativeHandle(ref, () => ({
    refreshUsers: fetchUsers
  }))

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      // Update the users state immediately
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  const handleDeleteFile = async (userId: string, fileId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/file?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleAddFileClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsAddFileDialogOpen(true)
  }

  const handleAddFileSuccess = () => {
    // Refresh the users list to show the new file
    fetchUsers()
  }

  const handleAddCredits = (userId: string) => {
    setSelectedUserId(userId)
    setIsAddCreditsDialogOpen(true)
  }

  const handleAddCreditsSuccess = (newCredits: number) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUserId 
          ? { ...user, credits: newCredits } 
          : user
      )
    )
  }

  const handleDeleteUserClick = (userId: string, email: string) => {
    setSelectedUserId(userId)
    setSelectedUserEmail(email)
    setIsDeleteUserDialogOpen(true)
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "logo",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
              <Image
                src="/user.png"
                alt="User Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }: { column: Column<User> }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-3 h-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <span>Email</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel className="text-zinc-400">Sort</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800">
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800">
                Desc
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuLabel className="text-zinc-400">Filter</DropdownMenuLabel>
              <div className="p-2">
                <input
                  type="text"
                  value={(column.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    column.setFilterValue(event.target.value)
                  }
                  placeholder="Filter emails..."
                  className="w-full border-0 bg-transparent py-1.5 text-sm leading-none placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "userType",
      header: "User Type",
      cell: ({ row }) => {
        const userType = row.getValue("userType") as string
        return userType ? (
          <Badge variant={userType === "workmate" ? "default" : "secondary"}>
            {userType === "workmate" ? "Workmate User" : "General User"}
          </Badge>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => row.getValue("title") || "-",
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => {
        const credits = row.getValue("credits") as number
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium">{credits}</div>
            <Badge variant={credits > 0 ? "secondary" : "destructive"}>
              {credits > 0 ? "Active" : "No Credits"}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const files = row.getValue("files") as FileInfo[]
        return (
          <div className="flex flex-col gap-1">
            {files && files.map((file) => (
              <div key={file.id} className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{file.originalName || file.filename}</span>
                  <span className="text-xs text-zinc-400">
                    {file.recordCount} rows, {file.columnCount} columns
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={() => handleDeleteFile(row.original.id, file.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string
        return new Date(createdAt).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel className="text-zinc-400">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleAddFileClick(user.id)}
                className="text-blue-400 hover:bg-zinc-800 hover:text-blue-400 focus:bg-zinc-800 focus:text-blue-400"
              >
                Add File
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAddCredits(user.id)}
                className="text-green-400 hover:bg-zinc-800 hover:text-green-400 focus:bg-zinc-800 focus:text-green-400"
              >
                Add Credits
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => handleDeleteUserClick(user.id, user.email)}
                className="text-red-400 hover:bg-zinc-800 hover:text-red-400 focus:bg-zinc-800 focus:text-red-400"
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      employeeSize: (row, columnId, value) => {
        const employeeCount = parseInt(row.getValue<string>(columnId).replace(/[^0-9]/g, '')) || 0;
        switch (value) {
          case 'lt100': return employeeCount < 100;
          case '100-500': return employeeCount >= 100 && employeeCount <= 500;
          case 'gt500': return employeeCount > 500;
          default: return true;
        }
      },
      revenue: (row, columnId, value) => {
        const revenue = parseFloat(row.getValue<string>(columnId).replace(/[^0-9.-]+/g, "")) || 0;
        switch (value) {
          case 'lt1M': return revenue < 1000000;
          case '1M-50M': return revenue >= 1000000 && revenue <= 50000000;
          case 'gt50M': return revenue > 50000000;
          default: return true;
        }
      }
    },
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#1C1C1C]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Safely get the row model and rows
  let rows: any[] = [];
  try {
    const rowModel = table?.getRowModel?.();
    rows = rowModel?.rows || [];
  } catch (error) {
    console.error("Error getting row model:", error);
    // Fall back to empty array if there's an error
    rows = [];
  }

  return (
    <>
      <AddCreditsDialog
        userId={selectedUserId || ""}
        isOpen={isAddCreditsDialogOpen}
        onClose={() => {
          setIsAddCreditsDialogOpen(false)
          setSelectedUserId(null)
        }}
        onSuccess={handleAddCreditsSuccess}
      />
      <DeleteUserDialog
        userId={selectedUserId || ""}
        userEmail={selectedUserEmail}
        isOpen={isDeleteUserDialogOpen}
        onClose={() => {
          setIsDeleteUserDialogOpen(false)
          setSelectedUserId(null)
          setSelectedUserEmail("")
        }}
        onSuccess={async () => {
          if (selectedUserId) {
            try {
              // Update local state first for immediate UI feedback
              setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUserId))
              // Then refresh from server to ensure consistency
              await fetchUsers()
            } catch (error) {
              console.error("Error in deletion process:", error)
              // If there's an error, refresh the table to ensure correct state
              await fetchUsers()
            }
          }
        }}
      />
      <Dialog open={isAddFileDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedUserId(null)
        }
        setIsAddFileDialogOpen(open)
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[550px] [&>button]:text-white">
          <DialogHeader>
            <DialogTitle>Add File to User</DialogTitle>
          </DialogHeader>
          <AddFileForm 
            userId={selectedUserId || ""} 
            onSuccess={() => {
              setIsAddFileDialogOpen(false)
              setSelectedUserId(null)
              handleAddFileSuccess()
            }} 
          />
        </DialogContent>
      </Dialog>
      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              {table.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-zinc-400 bg-zinc-900 h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-zinc-800 hover:bg-zinc-900"
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-400">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end space-x-2 p-4 bg-[#1C1C1C] border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
})

