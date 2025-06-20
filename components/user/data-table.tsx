"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Eye, Search, Filter, ChevronDown, AlertCircle,
  Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin, Info, User, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
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
  Row,
  FilterFn,
  VisibilityState,
  ColumnPinningState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RowDetailsModal } from "./row-details-modal"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import * as React from "react"

declare module '@tanstack/table-core' {
  interface FilterFns {
    employeeSize: FilterFn<DataRow>
    revenue: FilterFn<DataRow>
  }
}

// Define a set of more subtle pastel colors
const COLUMN_COLORS = {
  industry: [
    "#ffe57f", // Darker yellow
    "#ffcdd2", // Darker light red
    "#c8e6c9", // Darker light green
    "#bbdefb", // Darker light blue
    "#e1bee7", // Darker light purple
    "#b2ebf2", // Darker light cyan
    "#ffe0b2", // Darker light orange
    "#dcedc8", // Darker light lime
    "#f8bbd0", // Darker light pink
    "#e0e0e0", // Darker light grey
    "#c5cae9", // Darker light indigo
    "#b2dfdb", // Darker light teal
  ],
  country: [
    "#ffcdd2", // Darker light red
    "#f7dc6f", // Darker pale yellow
    "#abebc6", // Darker pale green
    "#bbdefb", // Darker pale blue
    "#f5cba7", // Darker pale orange
    "#f5b7b1", // Darker pale red
    "#d7bde2", // Darker pale purple
    "#a3e4d7", // Darker pale teal
    "#f7dc6f", // Darker yellow
    "#abebc6", // Darker green
  ],
  technologies: [
    "#bbdefb", // Darker pale blue
    "#b2dfdb", // Darker pale teal
    "#fef5c3", // Darker pale yellow
    "#f5b7b1", // Darker pale red
    "#d5c5e5", // Darker pale purple
    "#abebc6", // Darker pale green
    "#f7dc6f", // Darker pale yellow
    "#e6b0aa", // Darker pale red
    "#f5b7b1", // Darker light red
    "#aed6f1", // Darker light blue
    "#a3e4d7", // Darker light teal
    "#f7dc6f", // Darker light yellow
  ]
};

// Function to get a consistent color for a specific column type
const getColumnTypeColor = (value: string, columnType: 'industry' | 'country' | 'technologies'): string => {
  // Create a hash of the value
  const hash = value.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to get a consistent index in our color array
  const colors = COLUMN_COLORS[columnType];
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

// Function to check if a column is an industry column
// Define a set of predefined pastel colors for industries
const INDUSTRY_COLORS = [
  "#ffeaa7", // Pastel yellow
  "#fab1a0", // Pastel coral
  "#81ecec", // Pastel cyan
  "#a29bfe", // Pastel purple
  "#74b9ff", // Pastel blue
  "#55efc4", // Pastel mint
  "#ff9ff3", // Pastel pink
  "#ffeaa7", // Pastel yellow
  "#e17055", // Darker coral
  "#0984e3", // Darker blue
  "#6c5ce7", // Darker purple
  "#00cec9", // Darker cyan
  "#fdcb6e", // Darker yellow
  "#fd79a8", // Darker pink
  "#00b894", // Darker mint
];

// Function to get a consistent color for an industry
const getIndustryColor = (value: string): string => {
  // Create a hash of the industry name
  const hash = value.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to get a consistent index in our color array
  const colorIndex = Math.abs(hash) % INDUSTRY_COLORS.length;
  return INDUSTRY_COLORS[colorIndex];
}

// Function to check if a column is an industry column
const isIndustryColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === "industry" || 
         key === "industry_client" || 
         key === "industry_nexuses" ||
         key.includes("industry");
}

// Function to check if a column is a country column
const isCountryColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === "country" || 
         key === "country_contact_person" ||
         key === "contact_country" ||
         key.includes("country") ||
         key === "contact country";
}

// Function to check if a column is a technologies column
const isTechnologiesColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === "technologies" || 
         key.includes("tech") || 
         key === "technology" ||
         key === "techs";
}

// Function to generate consistent colors for different columns
const getColumnColor = (value: string, columnKey: string) => {
  // Create a hash of the value string to get a consistent number
  const hash = value.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use different color ranges for different columns
  let baseHue;
  switch (columnKey) {
    case 'Industry':
      baseHue = Math.abs(hash % 30) + 0; // Warm oranges and reds (0-30)
      break;
    case 'Title':
      baseHue = Math.abs(hash % 60) + 180; // Blues (180-240)
      break;
    case 'Country':
      baseHue = Math.abs(hash % 30) + 270; // Purples (270-300)
      break;
    case 'Technologies':
      baseHue = Math.abs(hash % 60) + 90; // Greens (90-150)
      break;
    default:
      baseHue = Math.abs(hash % 360);
  }
  
  return `hsl(${baseHue}, 70%, 45%)`; // Medium saturation and lightness for subtle but noticeable colors
}

interface DataRow {
  [key: string]: string;  // Make it a dynamic object that can hold any string keys
}

interface UserData {
  title: string
  logoUrl: string
  dataFiles: Array<{
    id: string
    title: string
    filename: string
    columns: string[]
    data: DataRow[]
  }>
  credits: number
}

interface DataTableProps {
  selectedFileIndex: number
  activeFilters: Record<string, string[]>
  setIsFilterOpen: (isOpen: boolean) => void
  allFilesData?: DataRow[]
}

// Define the standard column order and mapping for Workmate User
const WORKMATE_USER_COLUMNS = [
  's_no',
  'account_name',
  'industry_client',
  'industry_nexuses',
  'type_of_company',
  'priority',
  'sales_manager',
  'no_of_employees',
  'revenue',
  'contact_name',
  'designation',
  'contact_number_personal',
  'phone_status',
  'email_id',
  'email_status',
  'person_linkedin_url',
  'website',
  'company_linkedin_url',
  'technologies',
  'city',
  'state',
  'country_contact_person',
  'company_address',
  'company_headquarter',
  'workmates_remark',
  'tm_remarks'
].map(col => col.toLowerCase());

// Define the standard column order and mapping for General User
const GENERAL_USER_COLUMNS = [
  'first_name',
  'last_name',
  'title',
  'company_name',
  'email',
  'email_status',
  'seniority',
  'departments',
  'personal_phone',
  'company_phone',
  'employees',
  'industry',
  'person_linkedin_url',
  'contact_country',
  'website',
  'technologies',
  'company_address',
  'company_linkedin_url',
  'company_country',
  'annual_revenue'
].map(col => col.toLowerCase());

// Map column names to their display names for both user types
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  // Workmate User columns
  s_no: "S. No.",
  account_name: "Account Name",
  industry_client: "Industry (Client)",
  industry_nexuses: "Industry (Nexuses)",
  type_of_company: "Company Type",
  priority: "Priority",
  sales_manager: "Sales Manager",
  no_of_employees: "Employee Count",
  revenue: "Revenue",
  contact_name: "Contact Name",
  designation: "Designation",
  contact_number_personal: "Personal Phone",
  phone_status: "Phone Status",
  email_id: "Email ID",
  email_status: "Email Status",
  person_linkedin_url: "LinkedIn Profile",
  website: "Website",
  company_linkedin_url: "Company LinkedIn",
  technologies: "Technologies",
  city: "City",
  state: "State",
  country_contact_person: "Contact Country",
  company_address: "Company Address",
  company_headquarter: "Company Headquarter",
  workmates_remark: "Workmates Remark",
  tm_remarks: "TM Remarks",

  // General User columns
  first_name: "First Name",
  last_name: "Last Name",
  title: "Title",
  company_name: "Company Name",
  email: "Email",
  seniority: "Seniority",
  departments: "Department",
  personal_phone: "Personal Phone",
  company_phone: "Company Phone",
  employees: "Employee Count",
  industry: "Industry",
  contact_country: "Contact Country",
  company_country: "Company Country",
  annual_revenue: "Annual Revenue"
};

// Map column names to icons
const COLUMN_ICONS: Record<string, any> = {
  S_No: Info,
  First_Name: User,
  Last_Name: User,
  Contact_Name: User,
  Designation: Briefcase,
  Title: Briefcase,
  Company: Building2,
  Account_name: Building2,
  Email: Mail,
  Email_id: Mail,
  Email_Status: Mail,
  Corporate_Phone: Phone,
  Personal_Phone: Phone,
  Contact_Number_Personal: Phone,
  Phone_Status: Phone,
  Employees_Size: Users,
  No_of_Employees: Users,
  Industry: Building2,
  Industry_client: Building2,
  Industry_Nexuses: Building2,
  Type_of_Company: Building2,
  Priority: Info,
  Sales_Manager: Briefcase,
  Revenue: DollarSign,
  Annual_Revenue: DollarSign,
  Technologies: Info,
  Person_Linkedin_Url: LinkedinIcon,
  Website: Globe,
  Company_Linkedin_Url: LinkedinIcon,
  Country: MapPin,
  Country_Contact_Person: MapPin,
  City: MapPin,
  State: MapPin,
  Company_Address: MapPin,
  Company_Headquarter: MapPin,
  Workmates_Remark: Info,
  TM_Remarks: Info
};

// Determine which columns should be treated as links
const URL_COLUMNS = ['Website', 'Person_Linkedin_Url', 'Company_Linkedin_Url'];

// Determine which columns might contain comma-separated values
const MULTI_VALUE_COLUMNS = ['Technologies'];

// Add this helper function at the top with other functions
const getGeneralFilters = (data: DataRow[]) => {
  // Determine if we have standard or new column format
  const hasNewColumns = data.length > 0 && ('Designation' in data[0] || 'Account_name' in data[0]);

  let titleField = 'Title';
  let industryField = 'Industry';
  let countryField = 'Country';
  let employeeSizeField = 'Employees_Size'; // Default to general user format
  let revenueField = hasNewColumns ? 'Revenue' : 'Annual_Revenue';

  // Map fields based on available data
  if (hasNewColumns) {
    if (data[0]['Designation']) titleField = 'Designation';
    if (data[0]['Industry_client']) industryField = 'Industry_client';
    if (data[0]['Country_Contact_Person']) countryField = 'Country_Contact_Person';
    
    // Special case for employee size - check for all possible field names
    if (data[0]['no_of_employees']) employeeSizeField = 'no_of_employees';
    else if (data[0]['No_of_Employees']) employeeSizeField = 'No_of_Employees';
    else if (data[0]['employees']) employeeSizeField = 'employees';
  } else {
    // For general users, also check if we have the alternate field names
    if (data[0]['employees']) employeeSizeField = 'employees';
    else if (data[0]['no_of_employees']) employeeSizeField = 'no_of_employees';
  }

  // Get unique values for each field
  const titles = Array.from(new Set(data.map(row => row[titleField])))
    .filter(Boolean)
    .sort();

  const industries = Array.from(new Set(data.map(row => row[industryField])))
    .filter(Boolean)
    .sort();

  const countries = Array.from(new Set(data.map(row => row[countryField])))
    .filter(Boolean)
    .sort();

  // Create employee size ranges
  const employeeSizeRanges = [
    { label: "< 100", value: "lt100" },
    { label: "100 - 500", value: "100-500" },
    { label: "500+", value: "gt500" }
  ];

  // Create revenue ranges
  const revenueRanges = [
    { label: "< 1M", value: "lt1M" },
    { label: "1M - 50M", value: "1M-50M" },
    { label: "50M+", value: "gt50M" }
  ];

  return {
    titles: titles.slice(0, 5),
    industries: industries.slice(0, 5),
    countries: countries.slice(0, 5),
    employeeSizeRanges,
    revenueRanges,
    fields: {
      title: titleField,
      industry: industryField,
      country: countryField,
      employeeSize: employeeSizeField,
      revenue: revenueField
    }
  };
};

// Add custom filter functions
const employeeSizeFilter: FilterFn<DataRow> = (row, columnId, value) => {
  // Try to get the employee size from any of the possible field names
  const getEmployeeSize = (row: any) => {
    const possibleFields = ['Employees_Size', 'No_of_Employees', 'employees', 'no_of_employees'];
    for (const field of possibleFields) {
      if (row[field]) {
        return row[field];
      }
    }
    // Fallback to the columnId if none of the known fields are found
    return row[columnId] || '';
  };

  const employeeSizeStr = getEmployeeSize(row.original);
  const employeeCount = parseInt(employeeSizeStr.toString().replace(/[^0-9]/g, '')) || 0;
  
  // Handle both internal codes and display values
  if (value === 'lt100' || value === '< 100') return employeeCount < 100;
  if (value === '100-500' || value === '100 - 500') return employeeCount >= 100 && employeeCount <= 500;
  if (value === 'gt500' || value === '500+') return employeeCount > 500;
  return true;
};

const revenueFilter: FilterFn<DataRow> = (row, columnId, value) => {
  const revenue = parseFloat(row.getValue<string>(columnId).replace(/[^0-9.-]+/g, "")) || 0;
  
  // Handle both internal codes and display values
  if (value === 'lt1M' || value === '< 1M') return revenue < 1000000;
  if (value === '1M-50M' || value === '1M - 50M') return revenue >= 1000000 && revenue <= 50000000;
  if (value === 'gt50M' || value === '50M+') return revenue > 50000000;
  return true;
};

// Keep only copy protection functions
const preventCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  return false;
};

const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  return false;
};

const preventSelection = (e: Event) => {
  e.preventDefault();
  return false;
};

// Now create a custom table component that doesn't have the built-in overflow
function CustomTable({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  );
}

export function DataTable({ selectedFileIndex, activeFilters, setIsFilterOpen, allFilesData }: DataTableProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [isRowDetailsOpen, setIsRowDetailsOpen] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pageSize, setPageSize] = useState<number>(10)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [showReviewSelected, setShowReviewSelected] = useState(false)
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['select'], // Select column is pinned by default
  })

  // Add useEffect for auto-closing export success dialog
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showExportSuccess) {
      timeoutId = setTimeout(() => {
        setShowExportSuccess(false);
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showExportSuccess]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch user data to get credits regardless of view
        const userResponse = await fetch("/api/user/data")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          
          setUserCredits(userData.credits || 0)
          
          if (allFilesData) {
            // If allFilesData is provided, use it but keep the credits from userData
            setUserData({
              title: "All Files",
              logoUrl: "",
              dataFiles: [{
                id: "all-files",
                title: "All Files",
                filename: "all-files.csv",
                columns: [],
                data: allFilesData
              }],
              credits: userData.credits || 0  // Use the actual credits from userData
            })
          } else {
            // If no allFilesData, use the complete userData
            setUserData(userData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [allFilesData])

  // Update the useEffect for column visibility initialization
  useEffect(() => {
    if (userData?.dataFiles && userData.dataFiles[selectedFileIndex]?.data[0]) {
      // Get the first row to determine user type
      const firstRow = userData.dataFiles[selectedFileIndex].data[0];
      
      // Get original column names
      const originalColumns = Object.keys(firstRow);
      console.log('Original columns:', originalColumns);
      
      // Case-insensitive check for workmate columns
      const isWorkmateUser = originalColumns.some(col => 
        col.toLowerCase().includes('workmate') ||
        col.toLowerCase().includes('tm_remark') ||
        col.toLowerCase().includes('industry_client') ||
        col.toLowerCase().includes('industry_nexuse')
      ) || (
        originalColumns.includes('s_no') || 
        originalColumns.includes('account_name') || 
        originalColumns.includes('workmates_remark')
      );
      
      console.log('Debug - Column Visibility:');
      console.log('First row data:', firstRow);
      console.log('Original columns:', originalColumns);
      console.log('Is Workmate User:', isWorkmateUser);
      
      // Initialize visibility state with essential columns only
      const initialVisibility: VisibilityState = {
        select: true // Always keep select column visible
      };
      
      // Define essential columns based on user type
      const essentialColumns = isWorkmateUser ? [
        'contact_name',
        'account_name',
        'designation',
        'industry_client',
        'country_contact_person',
        'email_id'
      ] : [
        'first_name',
        'last_name',
        'company_name',
        'email',
        'personal_phone',
        'industry'
      ];
      
      // Set visibility for essential columns
      essentialColumns.forEach(col => {
        if (originalColumns.includes(col)) {
          initialVisibility[col] = true;
        }
      });
      
      // Hide all other columns
      originalColumns.forEach(col => {
        if (!essentialColumns.includes(col) && col !== 'select') {
          initialVisibility[col] = false;
        }
      });
      
      console.log('Final column visibility state:', initialVisibility);
      setColumnVisibility(initialVisibility);
    }
  }, [userData, selectedFileIndex]);

  // Add utility functions for row selection
  const selectAllRows = () => {
    const newSelection: Record<string, boolean> = {};
    // Select all filtered rows across all pages (not just current page)
    filteredData.forEach((row, index) => {
      newSelection[index] = true;
    });
    setRowSelection(newSelection);
  };

  const deselectAllRows = () => {
    setRowSelection({});
  };

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!userData?.dataFiles[selectedFileIndex]?.data[0]) {
      return []
    }
    
    // Get the first row to determine available columns
    const firstRow = userData.dataFiles[selectedFileIndex].data[0];
    const originalColumns = Object.keys(firstRow);
    
    // Determine if this is workmate user data
    const isWorkmateUser = originalColumns.some(col => 
      col.toLowerCase().includes('workmate') ||
      col.toLowerCase().includes('tm_remark') ||
      col.toLowerCase().includes('industry_client') ||
      col.toLowerCase().includes('industry_nexuse')
    ) || (
      originalColumns.includes('s_no') || 
      originalColumns.includes('account_name') || 
      originalColumns.includes('workmates_remark')
    );
    
    console.log('Is Workmate User:', isWorkmateUser);
    console.log('Available columns:', originalColumns);
    
    // Determine which standard columns to use
    const standardColumns = isWorkmateUser ? WORKMATE_USER_COLUMNS : GENERAL_USER_COLUMNS;
    
    // Find which standard columns are present in the data
    const presentStandardColumns = standardColumns.filter(col => {
      // Check if column exists in the first row
      return originalColumns.includes(col) && 
             typeof firstRow[col] !== 'undefined';
    });
    
    console.log('Present standard columns:', presentStandardColumns);
    
    // Create a function to get a value from row data with case-insensitive field names
    const getFieldValue = (rowData: DataRow, field: string) => {
      // Try exact match
      if (rowData[field] !== undefined) {
        return rowData[field];
      }
      
      // Try lowercase version
      const lowerField = field.toLowerCase();
      if (rowData[lowerField] !== undefined) {
        return rowData[lowerField];
      }
      
      // Try uppercase version
      const upperField = field.toUpperCase();
      if (rowData[upperField] !== undefined) {
        return rowData[upperField];
      }
      
      // Try various case variations
      const fields = Object.keys(rowData);
      const matchingField = fields.find(f => f.toLowerCase() === field.toLowerCase());
      if (matchingField) {
        return rowData[matchingField];
      }
      
      return ''; // Return empty string as fallback
    };
    
    const defaultColumns: ColumnDef<DataRow>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center w-full h-full bg-[#4f9eb2] px-4 py-1">
            <Checkbox
              checked={table.getIsAllRowsSelected() || (Object.keys(rowSelection).length > 0 && table.getIsAllPageRowsSelected())}
              onCheckedChange={(value) => {
                if (value) {
                  selectAllRows();
                } else {
                  deselectAllRows();
                }
              }}
              aria-label="Select all"
              className="translate-y-[2px] border-white text-white"
            />
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center w-full h-full">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
        meta: { order: -1 }
      }
    ];

    // Use present standard columns first, then add any remaining original columns
    const columnsToInclude = [...new Set([...presentStandardColumns, ...originalColumns])];
    
    const dataColumns: ColumnDef<DataRow>[] = columnsToInclude.map((columnKey, index) => {
      const baseColumn: Partial<ColumnDef<DataRow>> = {
        accessorKey: columnKey,
        // Add an accessor function that uses our getFieldValue helper
        accessorFn: (row) => getFieldValue(row, columnKey),
        header: ({ column }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 -ml-3 font-medium text-white bg-[#4f9eb2] hover:text-white hover:bg-[#3e7e8e] tracking-wide text-sm w-full justify-between"
                >
                  <span>{COLUMN_DISPLAY_NAMES[columnKey.toLowerCase()] || columnKey.replace(/_/g, ' ')}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 shadow-lg rounded-md">
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Sort</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(false)}
                  className="text-sm hover:bg-[#4f9eb2]/10 focus:bg-[#4f9eb2]/10 cursor-pointer"
                >
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(true)}
                  className="text-sm hover:bg-[#4f9eb2]/10 focus:bg-[#4f9eb2]/10 cursor-pointer"
                >
                  Descending
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Filter</DropdownMenuLabel>
                <div className="p-2">
                  <Input
                    placeholder={`Filter ${COLUMN_DISPLAY_NAMES[columnKey.toLowerCase()] || columnKey.replace(/_/g, ' ')}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value)
                    }
                    className="h-8 w-full border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-blue-500 focus-visible:ring-opacity-30 focus-visible:border-blue-500 text-sm"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        cell: ({ row }: { row: Row<DataRow> }) => {
          // Use the already processed value from the accessor function
          const value = row.getValue(columnKey) as string || '';
          
          // Common styling for both user types
          if ((columnKey === "industry" || columnKey === "industry_client" || columnKey === "industry_nexuses" || 
               columnKey === "title" || columnKey === "designation" || 
               columnKey === "contact_country" || columnKey === "country_contact_person" || 
               columnKey === "technologies") && value) {
            const bgColor = getColumnColor(value, columnKey);
            
            // For Technologies column, show limited badges with "+X more"
            if ((columnKey.toLowerCase() === "technologies" || columnKey.toLowerCase().includes("tech")) && value && value.includes(',')) {
              const techs = value.split(',').map(t => t.trim());
              const MAX_VISIBLE = 2; // Show only first 2 technologies
              const remainingCount = techs.length - MAX_VISIBLE;
              
              return (
                <div className="flex items-center gap-1.5 max-w-[320px]">
                  {techs.slice(0, MAX_VISIBLE).map((tech: string, index: number) => (
                    <div 
                      key={index}
                      className="px-1.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border text-gray-700"
                      style={{ 
                        backgroundColor: getColumnTypeColor(tech, 'technologies'),
                        borderColor: getColumnTypeColor(tech, 'technologies')
                      }}
                    >
                      {tech}
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div 
                      className="px-1.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap text-gray-500 border"
                      style={{ backgroundColor: "#f0f0f0", borderColor: "#e0e0e0" }}
                      title={techs.slice(MAX_VISIBLE).join(', ')} // Show remaining on hover
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            }

            // Special styling for Title and Designation columns
            if (columnKey === "title" || columnKey === "designation") {
              return (
                <div 
                  className="inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]"
                  title={value} // Show full text on hover
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0 bg-[#4f9eb2]"
                  />
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {value}
                  </span>
                </div>
              );
            }

            // Industry, Country and other badge columns
            let badgeColor = 'rgb(249 250 251)'; // Default light gray
            let borderColor = 'rgb(229 231 235)'; // Default light border
            
            // Determine column type
            const colKey = columnKey.toLowerCase();
            if (colKey === "industry" || 
                colKey === "industry_client" || 
                colKey.includes("industry")) {
              badgeColor = getColumnTypeColor(value, 'industry');
              borderColor = badgeColor;
            } else if (colKey === "country" || 
                       colKey === "country_contact_person" || 
                       colKey === "contact_country" || 
                       colKey.includes("country")) {
              badgeColor = getColumnTypeColor(value, 'country');
              borderColor = badgeColor;
            } else if (colKey === "technologies" || 
                       colKey.includes("tech")) {
              badgeColor = getColumnTypeColor(value, 'technologies');
              borderColor = badgeColor;
            }
            
            return (
              <div 
                className={`px-2 py-0.5 rounded-md inline-block max-w-[180px] text-xs font-medium border text-gray-700`}
                style={{ 
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  backgroundColor: badgeColor,
                  borderColor: borderColor
                }}
                title={value}
              >
                {value}
              </div>
            );
          }

          // For email-like columns
          if (columnKey === "email" || columnKey === "email_id" || columnKey.toLowerCase().includes('email')) {
            return (
              <div 
                className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] gap-1.5 group"
                title={value}
              >
                <Mail className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For phone-like columns
          if (columnKey === "company_phone" || columnKey === "personal_phone" || columnKey === "contact_number_personal" || columnKey.toLowerCase().includes('phone')) {
            return (
              <div 
                className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] gap-1.5 group"
                title={value}
              >
                <Phone className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For URL-like columns
          if (columnKey === "website") {
            return (
              <div 
                className="text-black max-w-[140px] truncate h-5 flex items-center gap-1.5 group"
                title={value}
              >
                <Globe className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For LinkedIn columns
          if (columnKey.includes("linkedin_url") || columnKey.includes("linkedin")) {
            return (
              <div 
                className="text-black max-w-[160px] truncate h-5 flex items-center gap-1.5 group"
                title={value}
              >
                <LinkedinIcon className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For company columns
          if (columnKey === "company_name" || columnKey === "account_name") {
            return (
              <div 
                className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] gap-1.5 group"
                title={value}
              >
                <Building2 className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For address columns
          if (columnKey === "company_address" || columnKey === "company_headquarter" || columnKey === "city" || columnKey === "state") {
            return (
              <div 
                className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] gap-1.5 group"
                title={value}
              >
                <MapPin className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For remarks columns (Workmate specific)
          if (columnKey === "workmates_remark" || columnKey === "tm_remarks") {
            return (
              <div 
                className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]"
                title={value}
              >
                <Info className="h-3.5 w-3.5 text-[#4f9eb2] flex-shrink-0 opacity-70 mr-1.5" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // Default rendering for other columns
          return (
            <div 
              className="text-black h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]"
              title={value}
            >
              {value}
            </div>
          );
        },
      };

      // Add specific filter functions for special columns
      if (columnKey === "Employees_Size" || columnKey === "No_of_Employees") {
        baseColumn.filterFn = employeeSizeFilter;
      } else if (columnKey === "Annual_Revenue" || columnKey === "Revenue") {
        baseColumn.filterFn = revenueFilter;
      }

      return {
        ...baseColumn,
        // Add a sort order based on the column's position in the desired order
        meta: {
          order: index
        }
      } as ColumnDef<DataRow>;
    });

    return [...defaultColumns, ...dataColumns];
  }, [userData, selectedFileIndex])

  // Apply filters to the data
  const filteredData = useMemo(() => {
    if (!userData?.dataFiles[selectedFileIndex]?.data) return [];

    let data = userData.dataFiles[selectedFileIndex].data;

    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      data = data.filter(row => {
        return Object.entries(activeFilters).every(([filterKey, filterValues]) => {
          if (filterValues.length === 0) return true;

          const rowValue = row[filterKey];
          if (!rowValue) return false;

          // Handle different types of filters
          switch (filterKey) {
            case 'Industry':
            case 'Industry_client':
            case 'Industry_Nexuses':
            case 'Title':
            case 'Designation':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            case 'Employees_Size':
            case 'No_of_Employees':
              const employeeCount = parseInt(rowValue.replace(/[^0-9]/g, '')) || 0;
              return filterValues.some(value => {
                // The filter values here are '< 100', '100 - 500', '500+', not the internal codes
                if (value === '< 100') return employeeCount < 100;
                if (value === '100 - 500') return employeeCount >= 100 && employeeCount <= 500;
                if (value === '500+') return employeeCount > 500;
                return false;
              });
            case 'Annual_Revenue':
            case 'Revenue':
              const revenue = parseFloat(rowValue.replace(/[^0-9.-]+/g, "")) || 0;
              return filterValues.some(value => {
                // The filter values here are '< 1M', '1M - 50M', '50M+', not the internal codes
                if (value === '< 1M') return revenue < 1000000;
                if (value === '1M - 50M') return revenue >= 1000000 && revenue <= 50000000;
                if (value === '50M+') return revenue > 50000000;
                return false;
              });
            case 'Country':
            case 'Country_Contact_Person':
              return filterValues.includes(rowValue);
            case 'Technologies':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            default:
              // For other columns, do a simple includes check
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
          }
        });
      });
    }

    return data;
  }, [userData, selectedFileIndex, activeFilters]);

  // Add this after the filteredData calculation
  const generalFilters = useMemo(() => {
    if (!filteredData.length) return null;
    return getGeneralFilters(filteredData);
  }, [filteredData]);

  // Add useEffect to setup column pinning after data is loaded
  useEffect(() => {
    if (userData?.dataFiles && userData.dataFiles[selectedFileIndex]?.data[0]) {
      // Check which key columns are available in the data
      const firstRow = userData.dataFiles[selectedFileIndex].data[0];
      const pinnedColumns = ['select']; // Always pin select column
      
      // Check for key columns to pin
      if ('Contact_Name' in firstRow) pinnedColumns.push('Contact_Name');
      if ('contact_name' in firstRow) pinnedColumns.push('contact_name');
      if ('first_name' in firstRow) pinnedColumns.push('first_name');
      if ('last_name' in firstRow) pinnedColumns.push('last_name');
      // if ('account_name' in firstRow) pinnedColumns.push('account_name');
      
      // Update column pinning state
      setColumnPinning({ left: pinnedColumns });
    }
  }, [userData, selectedFileIndex]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    filterFns: {
      employeeSize: employeeSizeFilter,
      revenue: revenueFilter,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      }
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    manualPagination: false,
  })

  // Keep only copy protection effect
  useEffect(() => {
    document.addEventListener('copy', preventCopy);
    document.addEventListener('selectstart', preventSelection);
    
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any local storage or session storage if needed
        localStorage.clear();
        sessionStorage.clear();
        // Force reload to ensure clean state
        window.location.replace('/');
      } else {
        const data = await response.json().catch(() => null);
        console.error('Logout failed:', data?.message || 'Unknown error');
        // Still redirect to home page even if logout API fails
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect to home page even if there's an error
      window.location.replace('/');
    }
  };

  const handleExport = async () => {
    if (table.getSelectedRowModel().rows.length === 0) {
      setShowExportConfirm(false)
      setShowNoSelectionWarning(true)
      return
    }

    if (userCredits < table.getSelectedRowModel().rows.length) {
      alert(`Not enough credits! You need ${table.getSelectedRowModel().rows.length} credits but only have ${userCredits}`)
      return
    }

    setExporting(true)
    try {
      // First deduct credits
      const creditResponse = await fetch('/api/user/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: -table.getSelectedRowModel().rows.length
        }),
      })

      if (!creditResponse.ok) {
        throw new Error('Failed to update credits')
      }

      // Get the selected row indices
      const selectedIndices = table.getSelectedRowModel().rows.map(row => row.index)

      // Then trigger the export
      const exportResponse = await fetch('/api/user/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'selected',
          format: exportFormat,
          selectedRecords: table.getSelectedRowModel().rows.length,
          selectedIndices: selectedIndices
        }),
      })

      if (!exportResponse.ok) {
        throw new Error('Failed to export data')
      }

      // Get the blob from the response
      const blob = await exportResponse.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exported_data.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Refresh user data to update credits
      const userResponse = await fetch("/api/user/data")
      if (userResponse.ok) {
        const data = await userResponse.json()
        setUserCredits(data.credits)
        setUserData(data) // Update the entire user data to ensure UI is in sync
      }

      // Clear row selection after successful export
      table.resetRowSelection()
      
      setShowExportSuccess(true)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
      setShowExportConfirm(false)
    }
  }

  // First, let's fix the handleReviewSelected function to check row selection
  const handleReviewSelected = () => {
    if (table.getSelectedRowModel().rows.length === 0) {
      setShowNoSelectionWarning(true);
      return;
    }
    setShowReviewSelected(true);
  };

  if (loading) {
    return (
      <Card className="border-none shadow-none w-full bg-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userData || !userData.dataFiles[selectedFileIndex]) {
    // Check if we have allFilesData
    if (allFilesData) {
      const selectedFile = {
        id: "all-files",
        title: "All Files",
        filename: "all-files.csv",
        data: allFilesData
      }
      return (
        <Card className="border-none shadow-none w-full bg-white text-black" style={{ maxWidth: '100%' }}>
          <CardContent 
            className="p-1 select-none" 
            onContextMenu={preventContextMenu}
            style={{ maxWidth: '100%', overflowX: 'hidden' }}
          >
            {/* Logo and Header */}
            <div className="flex flex-col mb-1 w-full">
              
              
              
              
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-2 mb-3 px-1">
              {/* Top Row - Search and Actions - Responsive */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* Search - Full width on mobile, normal on desktop */}
                <div className="w-full sm:max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search in all columns..."
                      value={globalFilter ?? ""}
                      onChange={(event) => setGlobalFilter(event.target.value)}
                      className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#8370FC] focus-visible:ring-opacity-30 focus-visible:border-[#8370FC] rounded-md w-full"
                    />
                  </div>
                </div>
                
                {/* Action Buttons - Row with wrapping */}
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const openDropdown = document.querySelector('[data-state="open"]');
                      if (openDropdown) {
                        (openDropdown as HTMLElement).click();
                      }
                      setIsFilterOpen(true);
                    }}
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {Object.keys(activeFilters).length > 0 
                        ? `Filters (${Object.keys(activeFilters).length})` 
                        : "Filters"}
                    </span>
                  </Button>
                
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                      >
                        <Eye className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Columns</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md w-56">
                      <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      
                      {/* Quick selection options */}
                      <div className="p-2 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">Presets</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              const firstRow = userData?.dataFiles[selectedFileIndex]?.data[0];
                              const isWorkmateUser = firstRow && ('workmates_remark' in firstRow || 'tm_remarks' in firstRow);
                              
                              // Define essential columns based on user type - limited to most important
                              const essentialColumns = isWorkmateUser ? [
                                'contact_name',
                                'account_name',
                                'designation',
                                'industry_client',
                                'country_contact_person',
                                'technologies',
                                'email_id'
                              ] : [
                                'first_name',
                                'last_name',
                                'company_name',
                                'email',
                                'personal_phone',
                                'industry'
                              ];
                              const presetVisibility: VisibilityState = {};
                              // First hide all columns except select
                              table.getAllLeafColumns().forEach(column => {
                                presetVisibility[column.id] = column.id === 'select' || essentialColumns.includes(column.id);
                              });
                              table.setColumnVisibility(presetVisibility);
                            }}
                          >
                            Essential Only
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              const presetVisibility: VisibilityState = {};
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id !== "select") {
                                  presetVisibility[column.id] = true;
                                }
                              });
                              table.setColumnVisibility(presetVisibility);
                            }}
                          >
                            Show All
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              const presetVisibility: VisibilityState = {};
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id !== "select") {
                                  presetVisibility[column.id] = false;
                                }
                              });
                              table.setColumnVisibility(presetVisibility);
                            }}
                          >
                            Hide All
                          </Button>
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator className="bg-gray-100 my-1" />
                      
                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {table.getAllLeafColumns().filter(column => column.id !== "select").map(column => (
                          <div key={column.id} className="py-1.5 px-1 flex items-center space-x-2">
                            <Checkbox
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              id={`column-${column.id}`}
                              className="h-4 w-4 rounded border-gray-300 text-[#8370FC] focus:ring-[#8370FC]"
                            />
                            <label 
                              htmlFor={`column-${column.id}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {column.id.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                    onClick={handleReviewSelected}
                    disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
                  >
                    <Download className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {table.getFilteredSelectedRowModel().rows.length > 0 
                        ? `Export (${table.getFilteredSelectedRowModel().rows.length})` 
                        : "Export"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Table - Fixed overflow container structure */}
            <div className="overflow-hidden rounded-md border border-gray-100 shadow-sm w-full">
              <div className="overflow-x-auto">
                <div style={{ width: 'fit-content', minWidth: '100%', maxWidth: 'max-content' }}>
                  <Table className="select-none bg-white w-full border-collapse border border-gray-200" style={{ tableLayout: 'auto' }}>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow 
                          key={headerGroup.id} 
                          className="border-none select-none"
                        >
                          {headerGroup.headers.map((header, index) => (
                            <TableHead 
                              key={header.id} 
                              className={cn(
                                "text-white font-medium px-6 py-3 first:rounded-tl-md last:rounded-tr-md select-none text-sm transition-all duration-200",
                                header.id === "select" && "w-[40px] px-0",
                                "relative z-10"
                              )}
                              style={{ 
                                width: header.id === "select" ? "40px" : 
                                      header.id === "Technologies" ? "180px" : 
                                      header.id === "Industry" || header.id === "industry_client" ? "100px" : 
                                      header.id === "Country" || header.id === "country_contact_person" ? "100px" : 
                                      header.id === "email" || header.id === "email_id" ? "160px" : 
                                      header.id === "website" ? "140px" : "120px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                backgroundColor: "#4f9eb2",
                                borderColor: "#4f9eb2",
                                borderWidth: "1px",
                                borderStyle: "solid"
                              }}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="bg-white select-none">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, rowIndex) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={cn(
                              "hover:bg-gray-50/50 cursor-pointer select-none transition-all duration-200",
                              row.getIsSelected() ? "bg-[#EAE7FF] border-[#8370FC]/30" : "bg-white",
                              "hover:shadow-sm"
                            )}
                            onClick={() => {
                              setSelectedRow(row.original)
                              setIsRowDetailsOpen(true)
                            }}
                          >
                            {row.getVisibleCells().map((cell, cellIndex) => (
                              <TableCell 
                                key={cell.id} 
                                className={cn(
                                  "text-gray-600 px-6 py-2.5 select-none text-sm transition-all duration-200 border border-gray-200",
                                  cell.column.id === "select" && "pr-0 pl-0 w-[40px] text-center",
                                  row.getIsSelected() && "bg-[#EAE7FF]",
                                  rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-md",
                                  rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-md",
                                  "relative z-0 overflow-hidden"
                                )}
                                style={{ 
                                  userSelect: 'none', 
                                  WebkitUserSelect: 'none',
                                  width: cell.column.id === "select" ? "40px" : 
                                        cell.column.id === "Technologies" ? "180px" : 
                                        cell.column.id === "Industry" || cell.column.id === "industry_client" ? "100px" : 
                                        cell.column.id === "Country" || cell.column.id === "country_contact_person" ? "100px" : 
                                        cell.column.id === "email" || cell.column.id === "email_id" ? "160px" : 
                                        cell.column.id === "website" ? "140px" : "120px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  backgroundColor: row.getIsSelected() ? "#EAE7FF" : "white"
                                }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-20 text-center text-gray-400 bg-white select-none rounded-b-md border border-gray-200"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 py-4 px-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Rows per page selector - responsive */}
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-600 hidden sm:block">
                    Rows per page
                  </p>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 sm:h-9 w-[70px] sm:w-[80px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pagination - responsive */}
                <Pagination className="order-last sm:order-none w-full sm:w-auto flex justify-center">
                  <PaginationContent className="gap-1 sm:gap-2">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => table.previousPage()} 
                        className={cn(
                          "h-8 sm:h-9 px-2 sm:px-3 bg-white border-gray-200 hover:bg-gray-50",
                          !table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </PaginationPrevious>
                    </PaginationItem>
                    
                    {/* Generate page numbers - more responsive */}
                    {Array.from({ length: table.getPageCount() }).map((_, i) => {
                      // Show fewer pages on mobile
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                      const showReducedPages = isMobile || table.getPageCount() > 5;
                      
                      // On mobile: show only current page, first and last
                      // On desktop: show more surrounding pages
                      if (
                        i === 0 || 
                        i === table.getPageCount() - 1 || 
                        (showReducedPages 
                          ? pageIndex === i // On small screens, only show current
                          : Math.abs(i - pageIndex) <= 2) // On larger screens, show more
                      ) {
                        return (
                          <PaginationItem key={i} className={cn(
                            // Hide some page numbers on smaller screens if many pages
                            (showReducedPages && i !== 0 && i !== table.getPageCount() - 1 && i !== pageIndex) ? "hidden sm:inline-flex" : ""
                          )}>
                            <PaginationLink 
                              onClick={() => table.setPageIndex(i)}
                              isActive={pageIndex === i}
                              className={cn("h-8 sm:h-9 w-8 sm:w-9 font-medium", pageIndex === i && "bg-[#4f9eb2] text-white hover:bg-[#4f9eb2]/90")}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      // Add ellipsis if there's a gap (only add one ellipsis per gap)
                      // Simplified for mobile view
                      if (
                        (i === 1 && pageIndex > 2) || 
                        (i === table.getPageCount() - 2 && pageIndex < table.getPageCount() - 3)
                      ) {
                        return (
                          <PaginationItem key={i} className="hidden sm:inline-flex">
                            <PaginationEllipsis className="h-8 sm:h-9 text-[#4f9eb2]" />
                          </PaginationItem>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => table.nextPage()} 
                        className={cn(
                          "h-8 sm:h-9 px-2 sm:px-3 bg-white border-gray-200 hover:bg-gray-50",
                          !table.getCanNextPage() ? "pointer-events-none opacity-50" : ""
                        )}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                {/* Selected rows count - responsive */}
                <div className="text-xs sm:text-sm font-medium text-gray-600 order-first sm:order-none">
                  <span className="hidden sm:inline">{table.getFilteredSelectedRowModel().rows.length} of {" "} 
                  {table.getFilteredRowModel().rows.length} row(s) selected</span>
                  <span className="sm:hidden">{table.getFilteredSelectedRowModel().rows.length}/{table.getFilteredRowModel().rows.length} selected</span>
                </div>
              </div>
            </div>

            {/* Review Selected Dialog */}
            <Dialog open={showReviewSelected} onOpenChange={setShowReviewSelected}>
              <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
                <DialogHeader>
                  <DialogTitle>Review Selected Records</DialogTitle>
                  <DialogDescription>
                    Review the {table.getSelectedRowModel().rows.length} records you've selected before exporting
                  </DialogDescription>
                </DialogHeader>
                
                <div className="overflow-auto flex-grow mt-4 pr-2">
                  <div style={{ width: 'fit-content', minWidth: '100%' }}>
                    <Table className="w-full border-collapse border border-gray-200">
                      <TableHeader>
                        <TableRow className="border-none">
                          {table.getVisibleLeafColumns()
                            .filter(column => column.id !== "select" && column.getIsVisible())
                            .slice(0, 6)
                            .map((column) => (
                              <TableHead 
                                key={column.id} 
                                className="bg-[#4f9eb2] text-white px-6 py-3 text-sm font-medium"
                                style={{ 
                                  minWidth: "140px",
                                  borderColor: "#4f9eb2",
                                  borderWidth: "1px",
                                  borderStyle: "solid"
                                }}
                              >
                                {column.id.replace(/_/g, ' ')}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.getSelectedRowModel().rows.slice(0, 50).map((row: any, i: number) => {
                          const rowData = row.original;
                          return (
                            <TableRow 
                              key={i} 
                              className="bg-white hover:bg-gray-50/50 transition-all duration-200 hover:shadow-sm"
                            >
                              {table.getVisibleLeafColumns()
                                .filter(column => column.id !== "select" && column.getIsVisible())
                                .slice(0, 6)
                                .map(column => {
                                  const dataKey = column.id as keyof DataRow;
                                  const value = rowData[dataKey];
                                  if (column.id === "Title") {
                                    return (
                                      <TableCell 
                                        key={column.id} 
                                        className="px-6 py-2.5 text-sm border border-gray-200 text-gray-600"
                                      >
                                        <div 
                                          className="px-2 py-1 rounded-lg inline-block text-xs font-medium border bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                                        >
                                          {value}
                                        </div>
                                      </TableCell>
                                    );
                                  }
                                  return (
                                    <TableCell 
                                      key={column.id} 
                                      className="px-6 py-2.5 text-sm border border-gray-200 text-gray-600"
                                    >
                                      {typeof value === 'string' ? (
                                        (column.id === "Industry" || column.id === "Country" || column.id === "Technologies") ? (
                                          <div 
                                            className="px-2 py-1 rounded-lg inline-block text-xs font-medium border text-gray-700 shadow-sm"
                                            style={{
                                              backgroundColor: (column.id === "Industry") 
                                                ? getColumnTypeColor(value, 'industry')
                                                : (column.id === "Country")
                                                  ? getColumnTypeColor(value, 'country')
                                                  : getColumnTypeColor(value, 'technologies'),
                                              borderColor: (column.id === "Industry") 
                                                ? getColumnTypeColor(value, 'industry')
                                                : (column.id === "Country")
                                                  ? getColumnTypeColor(value, 'country')
                                                  : getColumnTypeColor(value, 'technologies')
                                            }}
                                          >
                                            {value}
                                          </div>
                                        ) : (
                                          <span className="text-gray-600 font-medium">{value}</span>
                                        )
                                      ) : (
                                        <span className="text-gray-600">{String(value)}</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                            </TableRow>
                          );
                        })}
                        {table.getSelectedRowModel().rows.length > 50 && (
                          <TableRow>
                            <TableCell 
                              colSpan={6}
                              className="px-6 py-3 text-center text-sm text-gray-500 italic bg-gray-50/50 border border-gray-200"
                            >
                              ... and {table.getSelectedRowModel().rows.length - 50} more records
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <strong>{table.getSelectedRowModel().rows.length}</strong> records selected
                      <span className="mx-2">•</span>
                      Will use <strong>{table.getSelectedRowModel().rows.length}</strong> credits
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowReviewSelected(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowReviewSelected(false);
                          setShowExportConfirm(true);
                        }}
                        className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                      >
                        Proceed to Export
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Confirmation Dialog */}
            <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Export</DialogTitle>
                  <DialogDescription>
                    Please review the export details before proceeding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {userCredits < table.getSelectedRowModel().rows.length ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Credits</AlertTitle>
                      <AlertDescription>
                        You don't have enough credits to export {table.getSelectedRowModel().rows.length} records.
                        Please contact your admin to get more credits.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Credit Information</AlertTitle>
                      <AlertDescription>
                        This export will cost {table.getSelectedRowModel().rows.length} credits.
                        You currently have {userCredits} credits available.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Current Credits:</span>
                      <span className="font-medium">{userCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Cost:</span>
                      <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Remaining Credits:</span>
                      <span className={`font-medium ${userCredits < table.getSelectedRowModel().rows.length ? 'text-red-500' : 'text-green-500'}`}>
                        {userCredits - table.getSelectedRowModel().rows.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Export Format Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Export Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportFormat('xlsx')}
                        className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                          exportFormat === 'xlsx' 
                            ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        <span className="font-medium">Excel (XLSX)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportFormat('csv')}
                        className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                          exportFormat === 'csv' 
                            ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        <span className="font-medium">CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExport}
                    disabled={exporting || userCredits < table.getSelectedRowModel().rows.length}
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* No Selection Warning Dialog */}
            <Dialog open={showNoSelectionWarning} onOpenChange={setShowNoSelectionWarning}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>No Records Selected</DialogTitle>
                  <DialogDescription>
                    Please select at least one record to export.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    onClick={() => setShowNoSelectionWarning(false)}
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    OK
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Export Success Dialog */}
            <Dialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Successful</DialogTitle>
                  <DialogDescription>
                    Your data has been exported successfully as {exportFormat.toUpperCase()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                    <AlertDescription className="text-green-700">
                      The file has been downloaded to your computer. You can find it in your downloads folder as exported_data.{exportFormat}
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Records Exported:</span>
                      <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Format:</span>
                      <span className="font-medium">{exportFormat.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Remaining Credits:</span>
                      <span className="font-medium text-green-500">{userCredits}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => setShowExportSuccess(false)}
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Row Details Modal */}
            <RowDetailsModal 
              isOpen={isRowDetailsOpen}
              onClose={() => setIsRowDetailsOpen(false)}
              rowData={selectedRow}
            />
          </CardContent>
        </Card>
      )
    }
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedFile = userData.dataFiles[selectedFileIndex]

  return (
    <Card className="border-none shadow-none w-full bg-white text-black">
      <CardContent 
        className="p-1 select-none" 
        onContextMenu={preventContextMenu}
      >
        {/* Logo and Header */}
        <div className="flex flex-col mb-1 w-full">
          {/* Empty header area */}
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-2 mb-3 px-1">
          {/* Top Row - Search and Actions - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search - Full width on mobile, normal on desktop */}
            <div className="w-full sm:max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#8370FC] focus-visible:ring-opacity-30 focus-visible:border-[#8370FC] rounded-md w-full"
                />
              </div>
            </div>
            
            {/* Action Buttons - Row with wrapping */}
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const openDropdown = document.querySelector('[data-state="open"]');
                  if (openDropdown) {
                    (openDropdown as HTMLElement).click();
                  }
                  setIsFilterOpen(true);
                }}
                className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
              >
                <Filter className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {Object.keys(activeFilters).length > 0 
                    ? `Filters (${Object.keys(activeFilters).length})` 
                    : "Filters"}
                </span>
              </Button>
            
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                  >
                    <Eye className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md w-56">
                  <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  
                  {/* Quick selection options */}
                  <div className="p-2 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Presets</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          const firstRow = userData?.dataFiles[selectedFileIndex]?.data[0];
                          const isWorkmateUser = firstRow && ('workmates_remark' in firstRow || 'tm_remarks' in firstRow);
                          
                          // Define essential columns based on user type - limited to most important
                          const essentialColumns = isWorkmateUser ? [
                            'contact_name',
                            'account_name',
                            'designation',
                            'industry_client',
                            'country_contact_person',
                            'technologies',
                            'email_id'
                          ] : [
                            'first_name',
                            'last_name',
                            'company_name',
                            'email',
                            'personal_phone',
                            'industry'
                          ];
                          const presetVisibility: VisibilityState = {};
                          // First hide all columns except select
                          table.getAllLeafColumns().forEach(column => {
                            presetVisibility[column.id] = column.id === 'select' || essentialColumns.includes(column.id);
                          });
                          table.setColumnVisibility(presetVisibility);
                        }}
                      >
                        Essential Only
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          const presetVisibility: VisibilityState = {};
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id !== "select") {
                              presetVisibility[column.id] = true;
                            }
                          });
                          table.setColumnVisibility(presetVisibility);
                        }}
                      >
                        Show All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          const presetVisibility: VisibilityState = {};
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id !== "select") {
                              presetVisibility[column.id] = false;
                            }
                          });
                          table.setColumnVisibility(presetVisibility);
                        }}
                      >
                        Hide All
                      </Button>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {table.getAllLeafColumns().filter(column => column.id !== "select").map(column => (
                      <div key={column.id} className="py-1.5 px-1 flex items-center space-x-2">
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          id={`column-${column.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-[#8370FC] focus:ring-[#8370FC]"
                        />
                        <label 
                          htmlFor={`column-${column.id}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {column.id.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9 rounded-md text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                onClick={handleReviewSelected}
                disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
              >
                <Download className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {table.getFilteredSelectedRowModel().rows.length > 0 
                    ? `Export (${table.getFilteredSelectedRowModel().rows.length})` 
                    : "Export"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Table - Fixed overflow container structure */}
        <div className="overflow-hidden rounded-md border border-gray-100 shadow-sm w-full">
          <div className="overflow-x-auto">
            <div style={{ width: 'fit-content', minWidth: '100%', maxWidth: 'max-content' }}>
              <Table className="select-none bg-white w-full border-collapse border border-gray-200" style={{ tableLayout: 'auto' }}>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow 
                          key={headerGroup.id} 
                          className="border-none select-none"
                        >
                          {headerGroup.headers.map((header, index) => (
                            <TableHead 
                              key={header.id} 
                              className={cn(
                                "text-white font-medium px-6 py-3 first:rounded-tl-md last:rounded-tr-md select-none text-sm transition-all duration-200",
                                header.id === "select" && "w-[40px] px-0",
                                "relative z-10"
                              )}
                              style={{ 
                                width: header.id === "select" ? "40px" : 
                                      header.id === "Technologies" ? "180px" : 
                                      header.id === "Industry" || header.id === "industry_client" ? "100px" : 
                                      header.id === "Country" || header.id === "country_contact_person" ? "100px" : 
                                      header.id === "email" || header.id === "email_id" ? "160px" : 
                                      header.id === "website" ? "140px" : "120px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                backgroundColor: "#4f9eb2",
                                borderColor: "#4f9eb2",
                                borderWidth: "1px",
                                borderStyle: "solid"
                              }}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="bg-white select-none">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, rowIndex) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={cn(
                              "hover:bg-gray-50/50 cursor-pointer select-none transition-all duration-200",
                              row.getIsSelected() ? "bg-[#EAE7FF] border-[#8370FC]/30" : "bg-white",
                              "hover:shadow-sm"
                            )}
                            onClick={() => {
                              setSelectedRow(row.original)
                              setIsRowDetailsOpen(true)
                            }}
                          >
                            {row.getVisibleCells().map((cell, cellIndex) => (
                              <TableCell 
                                key={cell.id} 
                                className={cn(
                                  "text-gray-600 px-6 py-2.5 select-none text-sm transition-all duration-200 border border-gray-200",
                                  cell.column.id === "select" && "pr-0 pl-0 w-[40px] text-center",
                                  row.getIsSelected() && "bg-[#EAE7FF]",
                                  rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-md",
                                  rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-md",
                                  "relative z-0 overflow-hidden"
                                )}
                                style={{ 
                                  userSelect: 'none', 
                                  WebkitUserSelect: 'none',
                                  width: cell.column.id === "select" ? "40px" : 
                                        cell.column.id === "Technologies" ? "180px" : 
                                        cell.column.id === "Industry" || cell.column.id === "industry_client" ? "100px" : 
                                        cell.column.id === "Country" || cell.column.id === "country_contact_person" ? "100px" : 
                                        cell.column.id === "email" || cell.column.id === "email_id" ? "160px" : 
                                        cell.column.id === "website" ? "140px" : "120px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  backgroundColor: row.getIsSelected() ? "#EAE7FF" : "white"
                                }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-20 text-center text-gray-400 bg-white select-none rounded-b-md border border-gray-200"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

        {/* Pagination */}
            <div className="flex flex-col gap-4 py-4 px-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Rows per page selector - responsive */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-600 hidden sm:block">
                Rows per page
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 sm:h-9 w-[70px] sm:w-[80px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination - responsive */}
            <Pagination className="order-last sm:order-none w-full sm:w-auto flex justify-center">
              <PaginationContent className="gap-1 sm:gap-2">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => table.previousPage()} 
                    className={cn(
                      "h-8 sm:h-9 px-2 sm:px-3 bg-white border-gray-200 hover:bg-gray-50",
                      !table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </PaginationPrevious>
                </PaginationItem>
                
                {/* Generate page numbers - more responsive */}
                {Array.from({ length: table.getPageCount() }).map((_, i) => {
                  // Show fewer pages on mobile
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                  const showReducedPages = isMobile || table.getPageCount() > 5;
                  
                  // On mobile: show only current page, first and last
                  // On desktop: show more surrounding pages
                  if (
                    i === 0 || 
                    i === table.getPageCount() - 1 || 
                    (showReducedPages 
                      ? pageIndex === i // On small screens, only show current
                      : Math.abs(i - pageIndex) <= 2) // On larger screens, show more
                  ) {
                    return (
                      <PaginationItem key={i} className={cn(
                        // Hide some page numbers on smaller screens if many pages
                        (showReducedPages && i !== 0 && i !== table.getPageCount() - 1 && i !== pageIndex) ? "hidden sm:inline-flex" : ""
                      )}>
                        <PaginationLink 
                          onClick={() => table.setPageIndex(i)}
                          isActive={pageIndex === i}
                          className={cn("h-8 sm:h-9 w-8 sm:w-9 font-medium", pageIndex === i && "bg-[#4f9eb2] text-white hover:bg-[#4f9eb2]/90")}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Add ellipsis if there's a gap (only add one ellipsis per gap)
                  // Simplified for mobile view
                  if (
                    (i === 1 && pageIndex > 2) || 
                    (i === table.getPageCount() - 2 && pageIndex < table.getPageCount() - 3)
                  ) {
                    return (
                      <PaginationItem key={i} className="hidden sm:inline-flex">
                        <PaginationEllipsis className="h-8 sm:h-9 text-[#4f9eb2]" />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => table.nextPage()} 
                    className={cn(
                      "h-8 sm:h-9 px-2 sm:px-3 bg-white border-gray-200 hover:bg-gray-50",
                      !table.getCanNextPage() ? "pointer-events-none opacity-50" : ""
                    )}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* Selected rows count - responsive */}
            <div className="text-xs sm:text-sm font-medium text-gray-600 order-first sm:order-none">
              <span className="hidden sm:inline">{table.getFilteredSelectedRowModel().rows.length} of {" "} 
              {table.getFilteredRowModel().rows.length} row(s) selected</span>
              <span className="sm:hidden">{table.getFilteredSelectedRowModel().rows.length}/{table.getFilteredRowModel().rows.length} selected</span>
            </div>
          </div>
        </div>

        {/* Review Selected Dialog */}
        <Dialog open={showReviewSelected} onOpenChange={setShowReviewSelected}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
            <DialogHeader>
              <DialogTitle>Review Selected Records</DialogTitle>
              <DialogDescription>
                Review the {table.getSelectedRowModel().rows.length} records you've selected before exporting
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-auto flex-grow mt-4 pr-2">
              <div style={{ width: 'fit-content', minWidth: '100%' }}>
                <Table className="w-full border-collapse border border-gray-200">
                  <TableHeader>
                    <TableRow className="border-none">
                      {table.getVisibleLeafColumns()
                        .filter(column => column.id !== "select" && column.getIsVisible())
                        .slice(0, 6)
                        .map((column) => (
                          <TableHead 
                            key={column.id} 
                            className="bg-[#4f9eb2] text-white px-6 py-3 text-sm font-medium"
                            style={{ 
                              minWidth: "140px",
                              borderColor: "#4f9eb2",
                              borderWidth: "1px",
                              borderStyle: "solid"
                            }}
                          >
                            {column.id.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.getSelectedRowModel().rows.slice(0, 50).map((row: any, i: number) => {
                      const rowData = row.original;
                      return (
                        <TableRow 
                          key={i} 
                          className="bg-white hover:bg-gray-50/50 transition-all duration-200 hover:shadow-sm"
                        >
                          {table.getVisibleLeafColumns()
                            .filter(column => column.id !== "select" && column.getIsVisible())
                            .slice(0, 6)
                            .map(column => {
                              const dataKey = column.id as keyof DataRow;
                              const value = rowData[dataKey];
                              if (column.id === "Title") {
                                return (
                                  <TableCell 
                                    key={column.id} 
                                    className="px-6 py-2.5 text-sm border border-gray-200 text-gray-600"
                                  >
                                    <div 
                                      className="px-2 py-1 rounded-lg inline-block text-xs font-medium border bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                                    >
                                      {value}
                                    </div>
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell 
                                  key={column.id} 
                                  className="px-6 py-2.5 text-sm border border-gray-200 text-gray-600"
                                >
                                  {typeof value === 'string' ? (
                                    (column.id === "Industry" || column.id === "Country" || column.id === "Technologies") ? (
                                      <div 
                                        className="px-2 py-1 rounded-lg inline-block text-xs font-medium border text-gray-700 shadow-sm"
                                        style={{
                                          backgroundColor: (column.id === "Industry") 
                                            ? getColumnTypeColor(value, 'industry')
                                            : (column.id === "Country")
                                              ? getColumnTypeColor(value, 'country')
                                              : getColumnTypeColor(value, 'technologies'),
                                          borderColor: (column.id === "Industry") 
                                            ? getColumnTypeColor(value, 'industry')
                                            : (column.id === "Country")
                                              ? getColumnTypeColor(value, 'country')
                                              : getColumnTypeColor(value, 'technologies')
                                        }}
                                      >
                                        {value}
                                      </div>
                                    ) : (
                                      <span className="text-gray-600 font-medium">{value}</span>
                                    )
                                  ) : (
                                    <span className="text-gray-600">{String(value)}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                        </TableRow>
                      );
                    })}
                    {table.getSelectedRowModel().rows.length > 50 && (
                      <TableRow>
                        <TableCell 
                          colSpan={6}
                          className="px-6 py-3 text-center text-sm text-gray-500 italic bg-gray-50/50 border border-gray-200"
                        >
                          ... and {table.getSelectedRowModel().rows.length - 50} more records
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <strong>{table.getSelectedRowModel().rows.length}</strong> records selected
                  <span className="mx-2">•</span>
                  Will use <strong>{table.getSelectedRowModel().rows.length}</strong> credits
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReviewSelected(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowReviewSelected(false);
                      setShowExportConfirm(true);
                    }}
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    Proceed to Export
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Confirmation Dialog */}
        <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Export</DialogTitle>
              <DialogDescription>
                Please review the export details before proceeding
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {userCredits < table.getSelectedRowModel().rows.length ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient Credits</AlertTitle>
                  <AlertDescription>
                    You don't have enough credits to export {table.getSelectedRowModel().rows.length} records.
                    Please contact your admin to get more credits.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Credit Information</AlertTitle>
                  <AlertDescription>
                    This export will cost {table.getSelectedRowModel().rows.length} credits.
                    You currently have {userCredits} credits available.
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Current Credits:</span>
                  <span className="font-medium">{userCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Cost:</span>
                  <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining Credits:</span>
                  <span className={`font-medium ${userCredits < table.getSelectedRowModel().rows.length ? 'text-red-500' : 'text-green-500'}`}>
                    {userCredits - table.getSelectedRowModel().rows.length}
                  </span>
                </div>
              </div>
              
              {/* Export Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                      exportFormat === 'xlsx' 
                        ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Excel (XLSX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                      exportFormat === 'csv' 
                        ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">CSV</span>
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={exporting || userCredits < table.getSelectedRowModel().rows.length}
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
              >
                {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* No Selection Warning Dialog */}
        <Dialog open={showNoSelectionWarning} onOpenChange={setShowNoSelectionWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Records Selected</DialogTitle>
              <DialogDescription>
                Please select at least one record to export.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                onClick={() => setShowNoSelectionWarning(false)}
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Success Dialog */}
        <Dialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Successful</DialogTitle>
              <DialogDescription>
                Your data has been exported successfully as {exportFormat.toUpperCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                <AlertDescription className="text-green-700">
                  The file has been downloaded to your computer. You can find it in your downloads folder as exported_data.{exportFormat}
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Records Exported:</span>
                  <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Format:</span>
                  <span className="font-medium">{exportFormat.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credits Used:</span>
                  <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining Credits:</span>
                  <span className="font-medium text-green-500">{userCredits}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setShowExportSuccess(false)}
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Row Details Modal */}
        <RowDetailsModal 
          isOpen={isRowDetailsOpen}
          onClose={() => setIsRowDetailsOpen(false)}
          rowData={selectedRow}
        />
      </CardContent>
    </Card>
  )
}

