import { EmbeddedApp } from '@/components/embedded/EmbeddedApp'

export default async function EmbeddedPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>
}) {
  const params = await searchParams
  return <EmbeddedApp shop={params.shop ?? ''} host={params.host ?? ''} />
}
