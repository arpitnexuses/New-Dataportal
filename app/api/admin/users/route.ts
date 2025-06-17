import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { hashPassword, isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import type { IDataFile } from "@/lib/models/dataFile"
import mongoose from "mongoose"
import ExcelJS from 'exceljs'

interface PopulatedUserDataFile {
  fileId: IDataFile & { _id: mongoose.Types.ObjectId }
  title: string
  createdAt: Date
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId
  email: string
  role: string
  title?: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
  dataFiles: PopulatedUserDataFile[]
}

// All supported columns - all are optional to support both old and new data formats
const ALL_SUPPORTED_COLUMNS = [
  'S_No',
  'Account_name',
  'Industry_client',
  'Industry_Nexuses',
  'Type_of_Company',
  'priority',
  'Sales_Manager',
  'No_of_Employees',
  'Revenue',
  'Contact_Name',
  'Designation',
  'Contact_Number_Personal',
  'Phone_Status',
  'Email_id',
  'Email_Status',
  'Person_Linkedin_Url',
  'Website',
  'Company_Linkedin_Url',
  'Technologies',
  'City',
  'State',
  'Country_Contact_Person',
  'Company_Address',
  'Company_Headquarter',
  'Workmates_Remark',
  'TM_Remarks'
]

// Define the required columns for each user type
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
]

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
]

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()

    // Get all users with their data files, excluding admin users
    const users = await User.find({ role: { $ne: "admin" } })
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: "filename originalName data columns createdAt"
      })
      .select("-password") // Exclude password field
      .lean()
      .exec()

    // Format the response
    const formattedUsers = users.map(user => {
      // Calculate total records across all files
      const totalRecords = user.dataFiles.reduce((sum, file) => {
        const dataFile = file.fileId as IDataFile
        return sum + (dataFile?.data?.length || 0)
      }, 0)

      // Get the most recent file's date
      let mostRecentDate = null
      if (user.dataFiles.length > 0) {
        mostRecentDate = user.dataFiles.reduce((latest, file) => {
          const fileDate = new Date(file.createdAt)
          return fileDate > latest ? fileDate : latest
        }, new Date(0))
      }

      // Format files with metadata
      const files = user.dataFiles.map(file => {
        const dataFile = file.fileId as any;
        return {
          id: dataFile._id,
          title: file.title,
          filename: dataFile.filename || "Unknown",
          originalName: dataFile.originalName || "Unknown",
          recordCount: dataFile.data?.length || 0,
          columnCount: dataFile.columns?.length || 0,
          createdAt: file.createdAt
        };
      });

      return {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        title: user.title,
        credits: user.credits || 0,
        totalFiles: user.dataFiles.length,
        totalRecords: totalRecords,
        lastUpload: mostRecentDate,
        createdAt: user.createdAt,
        files: files
      }
    })

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const title = formData.get("title") as string
    const userType = formData.get("userType") as "workmate" | "general"
    const file = formData.get("file") as File

    if (!email || !password || !title || !file || !userType) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["workmate", "general"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if email is already in use
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    let parsedData: any[] = []
    const fileBuffer = await file.arrayBuffer()

    // Handle Excel files
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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
    } 
    // Handle CSV files
    else if (file.name.endsWith('.csv')) {
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

    // Basic validation
    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
    }

    const fileHeaders = Object.keys(parsedData[0] || {})
    if (!fileHeaders || fileHeaders.length === 0) {
      return NextResponse.json({ error: "No column headers found in the file." }, { status: 400 })
    }

    // Create a new data file
    const dataFile = await DataFile.create({
      data: parsedData,
      columns: fileHeaders,
      filename: file.name,
      originalName: file.name
    })

    // Create a new user with the uploaded file
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      userType,
      title,
      credits: 0,
      dataFiles: [{
        fileId: dataFile._id,
        title,
        createdAt: new Date()
      }]
    })

    // Return success response with user data
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        credits: user.credits,
        files: [{
          id: dataFile._id,
          title,
          recordCount: parsedData.length
        }]
      }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

