import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { getCurrentUser } from "@/lib/auth"
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, selectedRecords, selectedIndices, format = 'xlsx' } = body

    if (!type || (type === 'selected' && (!selectedRecords || !selectedIndices))) {
      return NextResponse.json({ error: "Invalid export parameters" }, { status: 400 })
    }

    await connectToDatabase()

    // Get user with all data files
    const user = await User.findById(session.id)
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: 'data columns'
      })
      .lean()
      .exec()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.dataFiles || user.dataFiles.length === 0) {
      return NextResponse.json({ error: "No data files found" }, { status: 404 })
    }

    // Combine all data from all files
    let allData = user.dataFiles.flatMap(file => 
      (file.fileId as any).data || []
    )

    // Get columns order from the first file that has columns defined
    let columnsOrder: string[] = []
    for (const file of user.dataFiles) {
      if ((file.fileId as any).columns && (file.fileId as any).columns.length > 0) {
        columnsOrder = (file.fileId as any).columns
        break
      }
    }

    // If no columns order is found, get it from the first data item
    if (columnsOrder.length === 0 && allData.length > 0) {
      columnsOrder = Object.keys(allData[0])
    }

    // If exporting selected records, use the selected indices
    if (type === 'selected' && selectedIndices) {
      allData = selectedIndices.map((index: number) => allData[index])
    }

    if (allData.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 })
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    // Generate the appropriate format
    if (format === 'csv') {
      // Generate CSV using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');
      
      // Add headers
      worksheet.addRow(columnsOrder);
      
      // Add data rows
      allData.forEach(item => {
        const row = columnsOrder.map(col => item[col] || '');
        worksheet.addRow(row);
      });
      
      // Generate CSV
      buffer = await workbook.csv.writeBuffer() as unknown as Buffer;
      contentType = 'text/csv';
      filename = 'exported_data.csv';
    } else {
      // Default to XLSX
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');
      
      // Add headers
      worksheet.addRow(columnsOrder);
      
      // Add data rows
      allData.forEach(item => {
        const row = columnsOrder.map(col => item[col] || '');
        worksheet.addRow(row);
      });
      
      // Generate Excel file
      buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = 'exported_data.xlsx';
    }

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 