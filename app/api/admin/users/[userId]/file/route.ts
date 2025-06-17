import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import ExcelJS from 'exceljs'

// All supported columns for workmate user
const WORKMATE_COLUMNS = [
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

// All supported columns for general user
const GENERAL_COLUMNS = [
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

// All supported columns - combine both sets
const ALL_SUPPORTED_COLUMNS = [...new Set([...WORKMATE_COLUMNS, ...GENERAL_COLUMNS])];

type RouteParams = {
  params: {
    userId: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let parsedData: any[] = []
    
    // Handle different file types
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const fileBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(fileBuffer)
      
      // Get the first worksheet
      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        return NextResponse.json({ error: "No worksheet found in the Excel file." }, { status: 400 })
      }
      
      // Get headers from the first row
      const headers: string[] = []
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? cell.value.toString().trim() : ''
      })
      
      // Process data rows
      parsedData = []
      worksheet.eachRow((row, rowNumber) => {
        // Skip header row
        if (rowNumber === 1) return
        
        const rowData: Record<string, any> = {}
        row.eachCell((cell, colNumber) => {
          if (colNumber <= headers.length && headers[colNumber - 1]) {
            rowData[headers[colNumber - 1]] = cell.value
          }
        })
        
        // Only add rows that have data
        if (Object.keys(rowData).length > 0) {
          parsedData.push(rowData)
        }
      })
    } else if (file.name.endsWith('.csv')) {
      // Process the new file
      const fileContent = await file.text()
      const result = parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      })
      parsedData = result.data
    } else {
      return NextResponse.json({ error: "Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file." }, { status: 400 })
    }

    // Basic validation - ensure there's data
    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
    }

    // Ensure the file has at least some column headers
    const fileHeaders = Object.keys(parsedData[0] || {})
    if (!fileHeaders || fileHeaders.length === 0) {
      return NextResponse.json({ error: "No column headers found in the file." }, { status: 400 })
    }

    // Convert headers to lowercase for case-insensitive comparison
    const lowercaseHeaders = fileHeaders.map(h => h.toLowerCase())

    // Check if any of the required columns are present
    const hasRequiredColumns = ALL_SUPPORTED_COLUMNS.some(col => lowercaseHeaders.includes(col))
    if (!hasRequiredColumns) {
      return NextResponse.json({ 
        error: "The file does not contain any of the required columns. Please check the file format." 
      }, { status: 400 })
    }

    // Create a new DataFile document
    const dataFile = await DataFile.create({
      data: parsedData,
      columns: fileHeaders,
      filename: file.name,
      originalName: file.name
    })

    // Add the file reference to the user's dataFiles array
    user.dataFiles.push({
      fileId: dataFile._id,
      title,
      createdAt: new Date()
    })

    await user.save()

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      fileId: dataFile._id,
      rowCount: parsedData.length 
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find and remove the file from user's dataFiles array
    const fileIndex = user.dataFiles.findIndex(
      (file) => file.fileId.toString() === fileId
    )

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete the data file
    await DataFile.findByIdAndDelete(fileId)

    // Remove the file from user's dataFiles array
    user.dataFiles.splice(fileIndex, 1)
    await user.save()

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 