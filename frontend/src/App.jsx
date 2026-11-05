import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/api/v1/products`)
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`)
        const data = await response.json()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  return (
    <main className="min-h-screen bg-emerald-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-emerald-800">FISIOGLOW</h1>
        <p className="mt-2 text-gray-600">Catálogo de rehabilitación</p>
        {loading && <p className="mt-8">Cargando productos...</p>}
        {error && <p className="mt-8 text-red-600">Error: {error}</p>}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map(product => (
            <article key={product.id} className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="mt-3">Precio: {product.price}</p>
              <p>Stock: {product.stock}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}