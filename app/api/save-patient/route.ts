import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface PatientData {
  pasienId: number;
  ingfo: {
    uniqHash: string;
    nmPasien: string;
    tglLahir: string;
    jenisKelamin: string;
    nmDokter: string;
    tglKonsul: string;
    tglIstirahat: string;
    tglIstirahatSelesai: string;
    urlValidasi: string;
  };
}

interface PatientFile {
  pasien: PatientData[];
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as { pasien: PatientData[] };
    
    // Get the path to pasien.json
    const filePath = path.join(process.cwd(), 'public', 'pasien.json');
    
    // Read existing data
    let existingData: PatientFile = { pasien: [] };
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContent) as PatientFile;
    } catch (error) {
      // If file doesn't exist or is invalid, we'll create a new one
      console.log('Creating new pasien.json file');
    }
    
    // Add new patient data
    existingData.pasien.push(...data.pasien);
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving patient data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save patient data' },
      { status: 500 }
    );
  }
} 