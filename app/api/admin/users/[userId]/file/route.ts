import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import * as XLSX from 'xlsx'

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
  'full_name',
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
      const workbook = XLSX.read(fileBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      parsedData = XLSX.utils.sheet_to_json(worksheet)
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
    if (fileHeaders.length === 0) {
      return NextResponse.json({ error: "The uploaded file has no column headers." }, { status: 400 })
    }

    // Clean and validate the data
    const cleanedData = parsedData.map((row, index) => {
      // Get original headers
      const originalHeaders = Object.keys(row);
      console.log('Original headers:', originalHeaders);
      
      // Create a new object for each row
      const cleanedRow: Record<string, string> = {};
      
      // First pass: just directly copy all the data with its original field names
      originalHeaders.forEach(header => {
        const value = (row[header] || '').toString().trim();
        cleanedRow[header] = value;
        
        // Also store the same data with lowercase keys to ensure consistent access
        cleanedRow[header.toLowerCase()] = value;
      });
      
      console.log('Cleaned row with all fields:', cleanedRow);
      return cleanedRow;
    });

    // Store the original column names
    const originalColumns = Object.keys(parsedData[0] || {});
    const lowerCaseColumns = originalColumns.map(col => col.toLowerCase());

    // Create a new data file record with the cleaned data
    const dataFile = await DataFile.create({
      filename: file.name,
      originalName: file.name,
      columns: lowerCaseColumns, // Store lowercase column names for consistency
      data: cleanedData,
    })

    // Add the new file to user's dataFiles array
    user.dataFiles.push({
      fileId: dataFile._id,
      title,
      createdAt: new Date(),
    })

    await user.save()

    return NextResponse.json({
      message: "File uploaded successfully",
      dataFile: {
        id: dataFile._id,
        title,
        filename: dataFile.originalName,
      },
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