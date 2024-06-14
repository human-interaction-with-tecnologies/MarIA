<template>
  <div
    :class="{
      ['loading']: loadingHistory,
      ['chat-drawer']: true
    }"
  >
    <div
      style="width: 100%; max-width: 400px; grid-area: 1 / 1 / 2 / 2; overflow-y: auto;"
      ref="chatContainer"
      :class="{
        ['bg-grey-10']: $q.dark.isActive,
        ['bg-grey-2']: !$q.dark.isActive
      }"
    >
      <div class="q-pa-md">
        <q-card class="shadow-2">
          <q-card-section class="text-h6">
            {{ $t('ai.help') }}
          </q-card-section>

          <q-separator />

          <q-card-section class="text-justify">
            {{ $t('ai.helpText') }}
          </q-card-section>
        </q-card>
      </div>

      <div
        style="width: 100%;"
        class="q-pa-md"
      >
        <q-chat-message
          v-for="(message, key) in messages"
          :key="key + messageKeyOffset"
          :sent="message.sent"
        >
          <template v-slot:default>
            <q-spinner-dots size="2rem" v-if="!message.sent && !message.text" />

            <div v-else>
              <div
                v-html="md.render(message.text)"
                style="max-width: 300px;"
                :class="{
                  ['text-left']: !message.sent,
                  ['text-right']: message.sent
                }"
              />
            </div>
          </template>
        </q-chat-message>
      </div>
    </div>

    <q-separator />

    <div
      style="grid-area: 3 / 1 / 4 / 2;"
      :class="{
        ['bg-dark']: $q.dark.isActive,
        ['bg-white']: !$q.dark.isActive,
        ['q-pa-sm']: true
      }"
    >
      <q-input
        v-model="message"
        @keydown.enter="sendMessage"
        :disable="messageFieldDisabled || loadingHistory"
        outlined
      >
        <template v-slot:append>
          <q-btn
            flat
            dense
            icon="mdi-send"
            @click="sendMessage"
          />
        </template>
      </q-input>
    </div>

    <div v-if="loadingHistory" class="spinner">
      <q-spinner
        :color="$q.dark.isActive ? 'grey-2' : 'grey-10'"
        size="3em"
        :thickness="2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import MarkdownItHighlight from 'markdown-it-highlightjs'
import axios from 'axios'
import { ref } from 'vue'

const auth = useFirebaseAuth()
const user = useCurrentUser()
const { t } = useI18n()

const md = new MarkdownIt({
  html: true,
  breaks: true
}).use(MarkdownItHighlight)

const message = ref('')
const messageKeyOffset = ref(0)
const messageFieldDisabled = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const messages = ref<{
  text: string
  sent: boolean
}[]>([])

const loadingHistory = ref(false)

function getHistory () {
  interface History {
    sentByUser: boolean
    content: string
  }

  return new Promise((resolve, reject) => {
    user.value?.getIdToken()
      .then(async token => {
        loadingHistory.value = true
        axios.get<{ history: History[] }>(`${import.meta.env.VITE_API_URL}/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(res => {
            messages.value = res.data.history.map((message: History) => ({
              text: message.content,
              sent: message.sentByUser
            }))
            resolve(res.data.history)
            loadingHistory.value = false
          })
          .catch(err => {
            reject(err)
          })
      })
      .catch(err => {
        reject(err)
      })
  })
}

async function sendMessage () {
  if (message.value.trim() === '') return

  messages.value.push({
    text: message.value,
    sent: true
  })

  const response = {
    text: '',
    sent: false
  }
  messages.value.push(response)
  messageFieldDisabled.value = true

  const res = await fetch(`${import.meta.env.VITE_API_URL}/chat?`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.value?.getIdToken()}`
    },
    body: JSON.stringify({
      message: message.value
    })
  })

  if (res.status === 200) {
    res.body?.pipeThrough(new TextDecoderStream()).pipeTo(new WritableStream({
      write (chunk) {
        messageKeyOffset.value++
        response.text += chunk
        console.log(chunk)
        chatContainer.value?.scrollTo(0, chatContainer.value.scrollHeight)
      },
      close () {
        messageFieldDisabled.value = false
        message.value = ''
        chatContainer.value?.scrollTo(0, chatContainer.value.scrollHeight)
      }
    }))
  } else {
    messageFieldDisabled.value = false
    message.value = ''
    response.text = t(`ai.error.code${res.status}`)
  }
}

const retry = setInterval(() => {
  if (auth !== undefined) {
    getHistory()
      .then(() => {
        clearInterval(retry)
      })
      .catch(err => {
        console.log(`Failed to fetch history: ${err}, trying again`)
      })
  }
}, 1000)
</script>

<style lang="scss">
pre > code {
  display: inline-block;
  line-height: 1rem;
  max-width: 300px;
  overflow-x: auto;
  color: white;
  background: $grey-10;
  border-radius: 5px;
  padding: 5px;
}

.loading {
  transition: opacity 200ms;
  cursor: not-allowed;
  pointer-events: none;
  user-select: none;

  div:not(.spinner) {
    opacity: 0.9;
  }
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.chat-drawer {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1px 70px;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
}
</style>
