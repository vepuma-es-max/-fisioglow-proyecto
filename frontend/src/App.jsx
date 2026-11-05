import { useEffect, useState } from 'react'
import Product3DViewer from './components/Product3DViewer'
import './index.css'

const API = import.meta.env.VITE_API_URL
const emptyForm = { name: '', price: '', stock: '', image_url: '' }

export default function App() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  async function loadProducts() {
    setFetching(true)
    try {
      const response = await fetch(`${API}/api/v1/products`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setProducts(data)
      setError('')
    } catch (err) {
      setError(`No se pudieron cargar los productos: ${err.message}`)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function addProduct(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const price = Number(form.price)
      const stock = Number(form.stock)
      if (!form.name.trim() || !Number.isFinite(price) || price < 0 ||
          !Number.isInteger(stock) || stock < 0) {
        throw new Error('Revisa los datos del producto')
      }

      const response = await fetch(`${API}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          price,
          stock,
          image_url: form.image_url.trim() || null
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setForm(emptyForm)
      setMessage('Producto registrado correctamente')
      await loadProducts()
    } catch (err) {
      setMessage(`No se pudo registrar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 p-3'

  return (
    <main className="min-h-screen bg-teal-50 p-6 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-teal-800">FisioGlow</h1>
          <p className="text-slate-600">Catálogo terapéutico - Proyecto MVP</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={addProduct} className="space-y-3 rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Registrar producto</h2>
            <input className={inputClass} placeholder="Nombre del producto"
              required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className={inputClass} type="number" min="0" step="0.01"
              placeholder="Precio" required value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} />
            <input className={inputClass} type="number" min="0" step="1"
              placeholder="Stock" required value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })} />
            <input className={inputClass} type="url"
              placeholder="URL de imagen (opcional)" value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })} />
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-teal-700 p-3 font-medium text-white disabled:opacity-50">
              {loading ? 'Guardando...' : 'Agregar producto'}
            </button>
            <p role="status">{message}</p>
          </form>

          <section>
            <h2 className="mb-3 text-xl font-bold">Modelo 3D interactivo</h2>
            <Product3DViewer />
            <p className="mt-2 text-sm text-slate-500">Arrastra el cubo para girarlo.</p>
          </section>
        </div>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Productos registrados</h2>
          {fetching && <p>Cargando productos...</p>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {!fetching && !error && products.length === 0 && <p>No hay productos registrados.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(product => (
              <article key={product.id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p>Precio: {product.price}</p>
                <p>Stock: {product.stock}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}