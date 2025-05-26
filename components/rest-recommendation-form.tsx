"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CalendarIcon, CheckCircle2, Clock, User, ClipboardList } from "lucide-react"
import { format, addDays } from "date-fns"
import { id } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/use-toast"
import * as z from "zod"
import crypto from "crypto"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CustomCalendar } from "@/components/custom-calendar"

// Define the doctor type
interface Doctor {
  nmDokter: string;
  dokterId: string;
}

// Define the diagnosis type
interface Diagnosis {
  gejala: string;
  description: string;
  diagnosisId: string;
}

// Add interface for patient data
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

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Nama lengkap harus diisi"),
  gender: z.string().min(1, "Jenis kelamin harus dipilih"),
  dob: z.date({
    required_error: "Tanggal lahir harus dipilih",
  }),
  namaDokter: z.string().min(1, "Nama dokter harus dipilih"),
  jumlahHariIstirahat: z.string().min(1, "Jumlah hari istirahat harus dipilih"),
  diagnosis: z.string().min(1, "Diagnosis harus dipilih"),
})

export function RestRecommendationForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [submittedDates, setSubmittedDates] = useState<{ start: Date; end: Date } | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: "",
      dob: undefined,
      namaDokter: "",
      jumlahHariIstirahat: "",
      diagnosis: "",
    },
  })

  useEffect(() => {
    // Fetch doctors data when component mounts
    fetch('/doktor.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch doctors data');
        }
        return response.json();
      })
      .then(data => {
        console.log('Loaded doctors data:', data);
        if (data && data.dokter) {
          setDoctors(data.dokter);
        } else {
          console.error('Invalid doctors data structure:', data);
          throw new Error('Invalid doctors data structure');
        }
      })
      .catch(error => {
        console.error('Error loading doctors:', error)
        toast({
          title: "Error",
          description: "Failed to load doctors data",
          variant: "destructive",
        })
      })

    // Fetch diagnosis data when component mounts
    fetch('/diagnosis.json')
      .then(response => response.json())
      .then(data => setDiagnoses(data.diagnosis))
      .catch(error => {
        console.error('Error loading diagnosis:', error)
        toast({
          title: "Error",
          description: "Failed to load diagnosis data",
          variant: "destructive",
        })
      })
  }, [toast])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Find the selected doctor and diagnosis details
      const selectedDoctor = doctors.find(doc => doc.nmDokter === data.namaDokter);
      const selectedDiagnosis = diagnoses.find(diag => diag.gejala === data.diagnosis);

      // Generate unique hash
      const uniqHash = crypto.randomBytes(16).toString('hex');
      
      // Get current date for consultation and rest dates
      const today = new Date();
      const restEndDate = addDays(today, parseInt(data.jumlahHariIstirahat) - 1);

      // Store the dates for display in verification step
      setSubmittedDates({
        start: today,
        end: restEndDate
      });

      // Format dates
      const formattedDob = format(data.dob, "dd MMMM yyyy", { locale: id });
      const formattedStartDate = format(today, "dd MMMM yyyy", { locale: id });
      const formattedEndDate = format(restEndDate, "dd MMMM yyyy", { locale: id });

      // Generate PDF
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nmPasien: data.name,
          jenisKelamin: data.gender,
          tglLahir: formattedDob,
          tglIstirahat: formattedStartDate,
          uniqHash,
        }),
      });

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        console.error('PDF generation error:', errorData);
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the PDF blob and create a download link
      const pdfBlob = await pdfResponse.blob();
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rekomendasi-istirahat-${uniqHash}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Prepare patient data
      const patientData: PatientData = {
        pasienId: 1,
        ingfo: {
          uniqHash,
          nmPasien: data.name,
          tglLahir: formattedDob,
          jenisKelamin: data.gender,
          nmDokter: data.namaDokter,
          tglKonsul: formattedStartDate,
          tglIstirahat: formattedStartDate,
          tglIstirahatSelesai: formattedEndDate,
          urlValidasi: `http://8.215.77.47:82/validasi/rekomendasi-istirahat/${uniqHash}`
        }
      };

      // Save to pasien.json
      const response = await fetch('/api/save-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pasien: [patientData] }),
      });

      if (!response.ok) {
        throw new Error('Failed to save patient data');
      }

      // Show success message
      toast({
        title: "Success",
        description: "PDF generated and downloaded successfully",
      });

      // Move to verification step
      setIsValidated(true);
      setStep(3);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {step === 1 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Silakan lengkapi data berikut untuk membuat surat rekomendasi istirahat Anda.
              </p>
            </div>

            <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nama Lengkap</FormLabel>
                      <FormControl>
                <Input
                          {...field}
                  className="border-gray-300 focus-visible:ring-teal-500"
                  placeholder="Masukkan nama lengkap"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Jenis Kelamin</FormLabel>
                        <FormControl>
                  <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" className="border-gray-300 text-teal-500" />
                              <Label htmlFor="male" className="cursor-pointer">Laki-laki</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" className="border-gray-300 text-teal-500" />
                              <Label htmlFor="female" className="cursor-pointer">Perempuan</Label>
                    </div>
                  </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Tanggal Lahir</FormLabel>
                        <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start border-gray-300 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                {field.value ? (
                                  format(field.value, "dd MMMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CustomCalendar
                                selectedDate={field.value}
                                onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

                <FormField
                  control={form.control}
                  name="jumlahHariIstirahat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Jumlah Hari Istirahat</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Pilih jumlah hari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hari</SelectItem>
                    <SelectItem value="2">2 Hari</SelectItem>
                    <SelectItem value="3">3 Hari</SelectItem>
                  </SelectContent>
                </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="namaDokter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nama Dokter</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Pilih nama dokter" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors && doctors.length > 0 ? (
                              doctors.map((doctor) => (
                                <SelectItem key={doctor.dokterId} value={doctor.nmDokter}>
                                  {doctor.nmDokter}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Diagnosis</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih diagnosis" />
                          </SelectTrigger>
                          <SelectContent>
                            {diagnoses.map((diagnosis) => (
                              <SelectItem key={diagnosis.diagnosisId} value={diagnosis.gejala}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{diagnosis.gejala}</span>
                                  <span className="text-sm text-gray-500">{diagnosis.description}</span>
              </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>

          <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                Mengenerate...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </form>
        </Form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Generate Surat Berhasil</h2>
            <p className="text-gray-600 text-center">
              Surat rekomendasi istirahat Anda telah berhasil digenerate dan valid.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-6 space-y-4">
            <div className="flex items-center mb-4">
              <ClipboardList className="h-5 w-5 text-teal-500 mr-2" />
            <h3 className="font-medium text-gray-900">Detail Surat Istirahat</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Nama Pasien</p>
                <p className="font-medium">{form.getValues("name")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Jenis Kelamin</p>
                <p className="font-medium">{form.getValues("gender") === "male" ? "Laki-laki" : "Perempuan"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Tanggal Lahir</p>
                <p className="font-medium">
                  {form.getValues("dob") ? format(form.getValues("dob"), "dd MMMM yyyy", { locale: id }) : "-"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-teal-500 mr-2" />
                <h4 className="font-medium text-gray-900">Periode Istirahat</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tanggal Mulai</p>
                  <p className="font-medium">
                    {submittedDates?.start ? format(submittedDates.start, "dd MMMM yyyy", { locale: id }) : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tanggal Selesai</p>
                  <p className="font-medium">
                    {submittedDates?.end ? format(submittedDates.end, "dd MMMM yyyy", { locale: id }) : "-"}
                  </p>
                </div>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-500">Jumlah Hari Istirahat</p>
                  <p className="font-medium">{form.getValues("jumlahHariIstirahat")} Hari</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-teal-500 mr-2" />
                <h4 className="font-medium text-gray-900">Informasi Dokter</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Nama Dokter</p>
                  <p className="font-medium">{form.getValues("namaDokter")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Diagnosis</p>
                  <p className="font-medium">{form.getValues("diagnosis")}</p>
                  <p className="text-sm text-gray-600">
                    {diagnoses.find(d => d.gejala === form.getValues("diagnosis"))?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white" onClick={() => window.print()}>
              Cetak Surat Hasil Generate
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-teal-500 text-teal-500 hover:bg-teal-50"
              onClick={() => {
                setStep(1)
                form.reset()
                setIsValidated(false)
              }}
            >
              Generate Surat Lain
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
