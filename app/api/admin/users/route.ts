import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { hashPassword, isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import type { IDataFile } from "@/lib/models/dataFile"
import mongoose from "mongoose"
import * as XLSX from 'xlsx'

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
]

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const users = await User.find({ role: "user" })
      .select("-password")
      .populate({
        path: "dataFiles.fileId",
        model: "DataFile",
        select: "filename originalName data columns"
      })
      .lean()
      .exec() as unknown as PopulatedUser[]

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        dataFiles: (user.dataFiles || []).map(file => ({
          fileId: file.fileId?._id?.toString() || null,
          title: file.title,
          filename: file.fileId?.originalName || 'Unknown',
          data: file.fileId?.data || [],
          columns: file.fileId?.columns || []
        })).filter(file => file.fileId !== null),
      })),
    })
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
      const workbook = XLSX.read(fileBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      parsedData = XLSX.utils.sheet_to_json(worksheet)
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

    // Basic validation - ensure there's data
    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
    }

    // Get the file headers
    const fileHeaders = Object.keys(parsedData[0] || {})
    
    // Validate headers based on user type
    const requiredColumns = userType === "workmate" ? WORKMATE_COLUMNS : GENERAL_COLUMNS
    const missingColumns = requiredColumns.filter(col => !fileHeaders.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns for ${userType} user type: ${missingColumns.join(", ")}` 
      }, { status: 400 })
    }

    // Create the data file
    const dataFile = await DataFile.create({
      filename: file.name,
      originalName: file.name,
      columns: fileHeaders,
      data: parsedData,
    })

    // Create the user with the data file
    const hashedPassword = await hashPassword(password)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      userType,
      title,
      dataFiles: [{
        fileId: dataFile._id,
        title,
      }],
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          title,
          userType,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

