import { useParams } from 'react-router-dom';

export default function ProductDetailPage() {
  const { sku } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--fg)]">Producto: {sku}</h1>
      <p className="text-[var(--fg-muted)]">Detalle del producto</p>
    </div>
  );
}
