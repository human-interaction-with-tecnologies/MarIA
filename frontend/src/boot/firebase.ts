import { boot } from 'quasar/wrappers'
import { initializeApp } from 'firebase/app'
import { VueFire, VueFireAuth } from 'vuefire'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  const firebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FB_APP_ID
  })

  app.use(VueFire, {
    firebaseApp,
    modules: [
      VueFireAuth()
    ]
  })
})
