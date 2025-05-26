import { RestRecommendationForm } from "@/components/rest-recommendation-form"
import { HalodocLogo } from "@/components/halodoc-logo"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <HalodocLogo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-teal-500 px-6 py-4">
              <h1 className="text-xl font-bold text-white">Surat Rekomendasi Istirahat</h1>
              <p className="text-teal-50">Buat surat rekomendasi istirahat dari dokter</p>
            </div>

            <div className="p-6">
              <RestRecommendationForm />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 Halodoc. All rights reserved.</p>
          <p className="mt-2">Halodoc adalah layanan kesehatan terpercaya di Indonesia.</p>
        </div>
      </footer>
    </div>
  )
}
