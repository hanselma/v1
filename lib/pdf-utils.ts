import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { differenceInYears, parse, isValid } from 'date-fns'
import fontkit from '@pdf-lib/fontkit'

interface PDFData {
  nmPasien: string
  jenisKelamin: string
  tglLahir: string
  tglIstirahat: string
  uniqHash: string
}

function calculateAge(birthDateStr: string): number {
  try {
    // Parse the date string (format: "dd MMMM yyyy")
    const birthDate = parse(birthDateStr, "dd MMMM yyyy", new Date())
    
    // Validate the parsed date
    if (!isValid(birthDate)) {
      console.error('Invalid date format:', birthDateStr)
      return 0
    }
    
    const today = new Date()
    const age = differenceInYears(today, birthDate)
    console.log('Birth date:', birthDate)
    console.log('Today:', today)
    console.log('Calculated age:', age)
    return age
  } catch (error) {
    console.error('Error calculating age:', error)
    return 0
  }
}

export async function generatePDF(data: PDFData): Promise<string> {
  try {
    // Read the template PDF
    const templatePath = path.join(process.cwd(), 'public', 'blank-template.pdf')
    console.log('Template path:', templatePath)
    
    // Check if template exists
    try {
      await fs.access(templatePath)
    } catch (error) {
      console.error('Template PDF not found:', templatePath)
      throw new Error('Template PDF not found')
    }
    
    const templateBytes = await fs.readFile(templatePath)
    console.log('Template PDF loaded, size:', templateBytes.length)
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes)
    
    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit)
    console.log('Fontkit registered')
    
    // Get the first page
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    
    // Load the Nunito-SemiBold font
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Nunito-SemiBold.ttf')
    console.log('Loading font from:', fontPath)
    
    try {
      const fontBytes = await fs.readFile(fontPath)
      const font = await pdfDoc.embedFont(fontBytes)
      console.log('Custom font loaded successfully')
      
      // Set font size to 12
      const fontSize = 11
      
      // Set text color to (40, 40, 40) with full opacity
      const textColor = rgb(40/255, 40/255, 40/255)
      
      // Calculate age from date of birth
      const age = calculateAge(data.tglLahir)
      console.log('Final age value:', age)
      
      // Define text positions (you may need to adjust these coordinates)
      const textPositions = {
        nama: { x: 120, y: 527 },
        kelamin: { x: 365, y: 527 },
        lahir: { x: 120, y: 495 },
        umur: { x: 175, y: 450 }
      }
      
      // Draw text on the PDF
      firstPage.drawText(data.nmPasien, {
        x: textPositions.nama.x,
        y: textPositions.nama.y,
        size: fontSize,
        font,
        color: textColor
      })
      
      firstPage.drawText(data.jenisKelamin === 'male' ? 'male' : 'female', {
        x: textPositions.kelamin.x,
        y: textPositions.kelamin.y,
        size: fontSize,
        font,
        color: textColor
      })
      
      firstPage.drawText(data.tglLahir, {
        x: textPositions.lahir.x,
        y: textPositions.lahir.y,
        size: fontSize,
        font,
        color: textColor
      })
      
      firstPage.drawText(`${age}`, {
        x: textPositions.umur.x,
        y: textPositions.umur.y,
        size: fontSize,
        font,
        color: textColor
      })
      
      console.log('Text drawn successfully')
    } catch (error) {
      console.error('Error loading or using custom font:', error)
      throw new Error(`Failed to load or use custom font: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    console.log('PDF modified and saved')
    
    // Create the output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'generated-pdfs')
    await fs.mkdir(outputDir, { recursive: true })
    console.log('Output directory created/verified:', outputDir)
    
    // Save the new PDF with the unique hash as filename
    const outputPath = path.join(outputDir, `${data.uniqHash}.pdf`)
    await fs.writeFile(outputPath, modifiedPdfBytes)
    console.log('New PDF saved:', outputPath)
    
    return outputPath
  } catch (error) {
    console.error('Error generating PDF:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate PDF: ${error.message}`)
    }
    throw new Error('Failed to generate PDF')
  }
} 