'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  AppProvider,
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  BlockStack,
  InlineStack,
  Select,
  Checkbox,
  TextField,
  Banner,
  Spinner,
  Divider,
  Box,
  Frame,
  Toast,
} from '@shopify/polaris'
import en from '@shopify/polaris/locales/en.json'

type StoreState = 'open' | 'closed'

type ScheduleWindow = {
  id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_enabled: boolean
  sort_order: number
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
  'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
]

// Read id_token from the URL — Shopify puts a fresh JWT here on every page load.
// It expires in 60s. App Bridge's idToken() gives unlimited fresh tokens if available.
function getUrlToken(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('id_token') ?? ''
}

function parseTokenIat(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.iat ?? 0
  } catch {
    return 0
  }
}

async function getBestToken(urlToken: string): Promise<string> {
  const s = window.shopify as { idToken?: () => Promise<string> } | undefined
  if (typeof s?.idToken === 'function') {
    try { return await s.idToken() } catch { /* fall through */ }
  }
  return urlToken
}

async function apiFetch(urlToken: string, path: string, options: RequestInit = {}) {
  const token = await getBestToken(urlToken)
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  })
}

export function EmbeddedApp({ shop }: { shop: string; host: string; initialToken: string }) {
  // URL token — valid for 60s from page load, available immediately
  const [urlToken] = useState(getUrlToken)
  const tokenIat = useRef(parseTokenIat(urlToken))

  const [storeState, setStoreState] = useState<StoreState | null>(null)
  const [lastToggle, setLastToggle] = useState<string | null>(null)
  const [windows, setWindows] = useState<ScheduleWindow[]>([])
  const [timezone, setTimezone] = useState('America/New_York')
  const [toggling, setToggling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)

  // Check if the URL token has aged past 55 seconds (approaching 60s expiry)
  useEffect(() => {
    if (!tokenIat.current) return
    const msLeft = (tokenIat.current + 55) * 1000 - Date.now()
    if (msLeft <= 0) { setSessionExpired(true); return }
    const t = setTimeout(() => setSessionExpired(true), msLeft)
    return () => clearTimeout(t)
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch(urlToken, '/api/embedded/status')
      if (!res.ok) throw new Error('Failed to load status')
      const data = await res.json()
      setStoreState(data.state)
      setLastToggle(data.lastToggleAt)
    } catch {
      setToast({ message: 'Could not load store status', error: true })
    }
  }, [urlToken])

  const loadSchedule = useCallback(async () => {
    try {
      const res = await apiFetch(urlToken, '/api/embedded/schedule')
      if (!res.ok) throw new Error('Failed to load schedule')
      const data = await res.json()
      setWindows(data.windows ?? [])
      setTimezone(data.timezone ?? 'America/New_York')
    } catch {
      setToast({ message: 'Could not load schedule', error: true })
    }
  }, [urlToken])

  // Fire data load immediately — don't wait for App Bridge
  useEffect(() => {
    if (!urlToken) return
    Promise.all([loadStatus(), loadSchedule()]).finally(() => setLoading(false))
  }, [urlToken, loadStatus, loadSchedule])

  async function handleToggle(desired: StoreState) {
    if (sessionExpired) { setToast({ message: 'Session expired — please refresh the page', error: true }); return }
    setToggling(true)
    try {
      const res = await apiFetch(urlToken, '/api/embedded/toggle', {
        method: 'POST',
        body: JSON.stringify({ desiredState: desired }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Toggle failed')
      setStoreState(data.state)
      setLastToggle(new Date().toISOString())
      setToast({ message: `Store is now ${data.state}` })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Toggle failed', error: true })
    } finally {
      setToggling(false)
    }
  }

  async function handleSaveSchedule() {
    if (sessionExpired) { setToast({ message: 'Session expired — please refresh the page', error: true }); return }
    setSaving(true)
    try {
      const res = await apiFetch(urlToken, '/api/embedded/schedule', {
        method: 'PUT',
        body: JSON.stringify({ windows, timezone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setToast({ message: 'Schedule saved' })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Save failed', error: true })
    } finally {
      setSaving(false)
    }
  }

  function updateWindow(index: number, field: keyof ScheduleWindow, value: string | boolean) {
    setWindows((prev) => prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)))
  }

  function addWindow() {
    setWindows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        day_of_week: prev.length % 7,
        open_time: '09:00',
        close_time: '17:00',
        is_enabled: true,
        sort_order: prev.length,
      },
    ])
  }

  function removeWindow(index: number) {
    setWindows((prev) => prev.filter((_, i) => i !== index))
  }

  if (!urlToken || loading) {
    return (
      <AppProvider i18n={en}>
        <Frame>
          <Page>
            <Box padding="1600">
              <InlineStack align="center">
                <Spinner size="large" />
              </InlineStack>
            </Box>
          </Page>
        </Frame>
      </AppProvider>
    )
  }

  return (
    <AppProvider i18n={en}>
      <Frame>
        {toast && (
          <Toast content={toast.message} error={toast.error} onDismiss={() => setToast(null)} />
        )}
        <Page
          title="On/Off Automation"
          subtitle={`Automatically open and close your store on a schedule · ${shop}`}
        >
          <Layout>
            {sessionExpired && (
              <Layout.Section>
                <Banner tone="warning">
                  Your session has expired. Refresh the page to continue making changes.
                </Banner>
              </Layout.Section>
            )}

            {/* Store Status */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Store Status</Text>
                  <InlineStack gap="300" align="start" blockAlign="center">
                    <Badge tone={storeState === 'open' ? 'success' : 'critical'}>
                      {storeState === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                    {lastToggle && (
                      <Text as="span" variant="bodySm" tone="subdued">
                        Last changed {new Date(lastToggle).toLocaleString()}
                      </Text>
                    )}
                  </InlineStack>
                  <Divider />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Manual override — bypasses the schedule and takes effect immediately.
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      tone="success"
                      onClick={() => handleToggle('open')}
                      loading={toggling && storeState !== 'open'}
                      disabled={toggling || storeState === 'open' || sessionExpired}
                    >
                      Open Now
                    </Button>
                    <Button
                      variant="primary"
                      tone="critical"
                      onClick={() => handleToggle('closed')}
                      loading={toggling && storeState !== 'closed'}
                      disabled={toggling || storeState === 'closed' || sessionExpired}
                    >
                      Close Now
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Schedule */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">Weekly Schedule</Text>
                    <Select
                      label="Timezone"
                      labelInline
                      options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
                      value={timezone}
                      onChange={setTimezone}
                    />
                  </InlineStack>

                  {windows.length === 0 && (
                    <Banner tone="info">
                      No schedule windows yet. Add a window below to automate store hours.
                    </Banner>
                  )}

                  <BlockStack gap="300">
                    {windows.map((w, i) => (
                      <Box key={w.id} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="200">
                          <InlineStack align="space-between" blockAlign="center">
                            <Checkbox
                              label={DAYS[w.day_of_week]}
                              checked={w.is_enabled}
                              onChange={(v) => updateWindow(i, 'is_enabled', v)}
                            />
                            <Button variant="plain" tone="critical" onClick={() => removeWindow(i)}>
                              Remove
                            </Button>
                          </InlineStack>
                          <InlineStack gap="200">
                            <Select
                              label="Day"
                              options={DAYS.map((d, di) => ({ label: d, value: String(di) }))}
                              value={String(w.day_of_week)}
                              onChange={(v) => updateWindow(i, 'day_of_week', v)}
                            />
                            <TextField
                              label="Open"
                              type="time"
                              value={w.open_time}
                              onChange={(v) => updateWindow(i, 'open_time', v)}
                              autoComplete="off"
                            />
                            <TextField
                              label="Close"
                              type="time"
                              value={w.close_time}
                              onChange={(v) => updateWindow(i, 'close_time', v)}
                              autoComplete="off"
                            />
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>

                  <InlineStack align="space-between">
                    <Button onClick={addWindow}>Add Window</Button>
                    <Button variant="primary" onClick={handleSaveSchedule} loading={saving} disabled={sessionExpired}>
                      Save Schedule
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* How it works */}
            <Layout.Section>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">How it works</Text>
                  <Text as="p" variant="bodySm">
                    A cron job runs every minute and checks the schedule. When it&apos;s time to open, your store&apos;s password protection is turned off. When it&apos;s time to close, password protection is turned on — customers see a &ldquo;Coming soon&rdquo; page until you reopen.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    All times are in the timezone selected above. Overlapping windows keep the store open for the combined duration.
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    </AppProvider>
  )
}

declare global {
  interface Window {
    shopify?: unknown
  }
}
