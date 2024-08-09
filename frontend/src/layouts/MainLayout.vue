<template>
  <q-layout view="hHr lpR fFf">
    <q-header :elevated="route.path !== '/'">
      <q-toolbar>
        <q-toolbar-title v-if="route.path !== '/'">
          MarIA
        </q-toolbar-title>

        <q-space />

        <q-btn
          round
          flat
          icon="mdi-theme-light-dark"
          @click="$q.dark.toggle()"
        />

        <q-btn
          round
          flat
          :loading="auth === undefined"
        >
          <user-avatar />

          <q-menu>
            <q-card style="width: 250px;" class="q-pa-md">
              <q-card-section class="column items-center">
                <user-avatar size="90px" />

                <div class="text-h6 q-mt-xs">
                  {{ user ? user.displayName : $t('auth.notLoggedIn') }}
                </div>
              </q-card-section>

              <q-card-section class="row justify-center items-center">
                <q-btn
                  v-if="user"
                  color="negative"
                  icon="mdi-logout"
                  :label="$t('auth.signOut')"
                  @click="logout"
                />

                <q-btn
                  v-else
                  color="primary"
                  icon="mdi-login"
                  :label="$t('auth.signIn')"
                  @click="authenticate"
                />
              </q-card-section>
            </q-card>
          </q-menu>
        </q-btn>

        <q-btn
          v-if="route.name === 'Main app'"
          @click="toggleRightDrawer"
          flat
          round
        >
          <div style="position: relative;">
            <q-icon
              name="mdi-chat"
              size="xs"
              style="display: absolute; left: 17px; top: -5px"
            />
            <q-icon
              name="mdi-robot-happy"
              size="xs"
              style="display: absolute; left: -17px"
            />
          </div>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      bordered
      v-model="rightDrawer"
      side="right"
      :width="400"
    >
      <chatbot-drawer />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import { ref } from 'vue'
import UserAvatar from './components/UserAvatar.vue'
import ChatbotDrawer from './components/ChatbotDrawer.vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const auth = useFirebaseAuth()
const user = useCurrentUser()
const route = useRoute()
const { t } = useI18n()
const { notify } = useQuasar()

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

function logout () {
  if (auth === null) {
    alert('Firebase not initialized')
    return
  }

  signOut(auth)
    .then(() => {
      window.location.reload()
    })
    .catch(err => {
      console.error(err)
    })
}

const rightDrawer = ref(false)

function toggleRightDrawer () {
  rightDrawer.value = !rightDrawer.value
}
</script>
