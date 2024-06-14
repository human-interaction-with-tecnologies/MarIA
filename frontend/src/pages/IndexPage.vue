<template>
  <q-page padding class="bg-primary">
    <div class="fit column items-center justify-center">
      <h1 class="display-1 text-white text-center">
        MarIA
      </h1>

      <p class="text-center text-white text-h6">
        {{ t('homepage.description') }}
      </p>

      <div class="q-mt-xl text-center">
        <q-btn
          color="accent"
          :label="t('homepage.getStarted')"
          @click="getStartedFunc"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const { notify } = useQuasar()
const { t } = useI18n()
const auth = useFirebaseAuth()
const user = useCurrentUser()
const router = useRouter()

function getStartedFunc () {
  console.log(user.value)
  if (user.value) {
    router.push({ name: 'Main app' })
  } else {
    authenticate()
  }
}

function authenticate () {
  if (auth === null) {
    alert('Firebase not initialized')
    return
  }

  const provider = new GoogleAuthProvider()
  signInWithPopup(auth, provider)
    .then(() => {
      notify({
        color: 'positive',
        message: t('auth.signInSuccess'),
        position: 'top'
      })
      router.push({ name: 'Main app' })
    })
    .catch(err => {
      notify({
        color: 'negative',
        message: t('auth.signInError'),
        position: 'top'
      })
      console.error(err)
    })
}
</script>
