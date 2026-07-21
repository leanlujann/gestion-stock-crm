import { useEffect, useState } from 'react'
import type { Producto } from '../api/types'

export function ProductoAutocomplete({
  productos,
  value,
  onSelect,
}: {
  productos: Producto[]
  value: string
  onSelect: (p: Producto) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = productos.find((p) => p.id === value)

  useEffect(() => {
    setQuery(selected ? selected.nombre : '')
  }, [selected?.id])

  const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative flex-1">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar producto..."
        className="w-full rounded-md px-2 py-2 text-sm field-input"
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[#17140F]/15 bg-[#F6F2E9] shadow-lg dark:border-[#EDE6D6]/15 dark:bg-[#16211c]">
          {filtrados.length === 0 && <li className="px-3 py-2 text-sm text-muted">Sin resultados</li>}
          {filtrados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p)
                  setQuery(p.nombre)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm surface-muted-hover"
              >
                {p.nombre} ({p.stockActual} {p.unidad})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
