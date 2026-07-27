import { Suspense } from 'react'
import ReservarForm from './reservar-form'

export default function ReservarPage() {
  return (
    <Suspense fallback={<div className='max-w-md mx-auto p-6 mt-10 text-center text-gray-500'>Cargando...</div>}>
      <ReservarForm />
    </Suspense>
  )
}
