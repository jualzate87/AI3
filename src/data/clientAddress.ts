/** Jordan Wells - client/recipient address (Loop 2 Build Spec). */
export const CLIENT_FIRST_NAME = 'Jordan'

export const CLIENT_ADDRESS = {
  name: 'Jordan Wells',
  street: '333 Easy Street',
  city: 'Austin',
  state: 'TX',
  zip: '78704',
} as const

export function formatClientCityStateZip(): string {
  const { city, state, zip } = CLIENT_ADDRESS
  return `${city}, ${state} ${zip}`
}
