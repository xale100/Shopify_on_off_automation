import { Resend } from 'resend'

let client: Resend | null = null

function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY not set')
    client = new Resend(key)
  }
  return client
}

export async function sendFailureAlert(
  merchantEmail: string,
  shopDomain: string,
  errorMessage: string
): Promise<void> {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@shopify-on-off.com'

  await resend.emails.send({
    from,
    to: merchantEmail,
    subject: `[Action Required] Store toggle failed for ${shopDomain}`,
    html: `
      <p>Hi,</p>
      <p>We were unable to toggle your Shopify store (<strong>${shopDomain}</strong>)
         as scheduled. Automation has been paused until the issue is resolved.</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p>To re-enable automation, please
         <a href="${process.env.SHOPIFY_APP_URL}/api/auth?shop=${shopDomain}">
           re-authorize the app
         </a>.
      </p>
      <p>If you need help, visit our <a href="${process.env.SHOPIFY_APP_URL}/support">support page</a>.</p>
    `,
  })
}
