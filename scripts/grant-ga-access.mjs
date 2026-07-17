/**
 * One-time script to grant the service account Viewer access to the GA4 property.
 * Run: node scripts/grant-ga-access.mjs <access_token>
 */

const SERVICE_ACCOUNT_EMAIL = 'loveseal-resources@perfect-science-498921-q0.iam.gserviceaccount.com'
const GA4_PROPERTY_ID       = '540956486'

const token = process.argv[2]
if (!token) {
  console.error('Usage: node scripts/grant-ga-access.mjs <access_token>')
  process.exit(1)
}

const url = `https://analyticsadmin.googleapis.com/v1alpha/properties/${GA4_PROPERTY_ID}/accessBindings`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({
    user:  SERVICE_ACCOUNT_EMAIL,
    roles: ['predefinedRoles/viewer'],
  }),
})

const text = await res.text()

if (res.ok) {
  console.log('Service account granted Viewer access to GA4 property.')
  console.log('You can now use /admin/analytics in your dashboard.')
} else {
  console.error(`Failed (HTTP ${res.status}):`, text)
}
