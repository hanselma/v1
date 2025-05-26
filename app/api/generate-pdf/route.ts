import { NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf-utils'
import fs from 'fs/promises'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Received data for PDF generation:', data)
    
    // Generate the PDF
    const pdfPath = await generatePDF(data)
    console.log('PDF generated successfully at:', pdfPath)
    
    // Read the generated PDF file
    const pdfBuffer = await fs.readFile(pdfPath)
    
    // Return the PDF file with appropriate headers for download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rekomendasi-istirahat-${data.uniqHash}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in generate-pdf API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 