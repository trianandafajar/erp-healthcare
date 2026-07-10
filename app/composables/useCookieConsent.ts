const CONSENT_KEY = 'cookie_consent_accepted'

export function useCookieConsent() {
  const show = ref(false)

  function init() {
    if (import.meta.client) {
      const accepted = localStorage.getItem(CONSENT_KEY) === 'true'
      if (!accepted) {
        show.value = true
      }
    }
  }

  function accept() {
    if (import.meta.client) {
      localStorage.setItem(CONSENT_KEY, 'true')
    }
    show.value = false
  }

  return { show, accept, init }
}
