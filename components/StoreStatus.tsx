'use client'

type Props = {
  shop: string
  currentState: 'open' | 'closed'
  lastToggleAt: string | null
  isFlagged: boolean
}

export default function StoreStatus({ shop, currentState, lastToggleAt, isFlagged }: Props) {
  const isOpen = currentState === 'open'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Status</h2>

      {isFlagged && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Automation paused — a toggle error occurred. Check your email and contact support if
          this persists.
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}
          />
          {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-sm text-gray-500">{shop}</span>
      </div>

      {lastToggleAt && (
        <p className="mt-2 text-xs text-gray-400">
          Last toggled: {new Date(lastToggleAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
