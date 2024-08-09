<template>
  <q-page padding>
    <q-form @submit.prevent="handleFile($event)">
      <div class="row q-col-gutter-md row">
        <q-file
          v-model="bibfile"
          accept=".bib"
          name="file"
          class="col-6"
          :label="$t('upload.prompt')"
          :rules="[
            val => !!val || $t('upload.required')
          ]"
          outlined
        />

        <q-select
          v-model="keywords"
          new-value-mode="add-unique"
          class="col-6"
          :label="$t('filtering.keywords')"
          :options="[]"
          use-input
          use-chips
          hide-dropdown-icon
          multiple
          outlined
        />
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          type="submit"
          icon="mdi-upload"
          :label="$t('upload.button')"
        />

        <q-toggle
          color="accent"
          v-model="filter"
          :label="$t('filtering.prompt')"
        />

        <q-space />

        <q-btn-dropdown
          color="accent"
          type="button"
          :label="$t('export.button')"
          icon="mdi-export"
          auto-close
        >
          <q-list>
            <q-item
              clickable
              v-ripple
              @click="exportData('csv')"
            >
              <q-item-section avatar>
                <q-icon color="primary" name="mdi-file-excel-outline" />
              </q-item-section>

              <q-item-section>CSV</q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              @click="exportData('bib')"
            >
              <q-item-section avatar>
                <q-icon color="primary" name="book" />
              </q-item-section>

              <q-item-section>BibTex</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-form>

    <div class="row q-mt-sm q-col-gutter-md">
      <div
        class="col-6"
        v-for="entry in (filter ? filteredEntries.toArray() : bibliography?.toArray())"
        :key="entry.key"
      >
        <entry-card
          class="fit"
          @review="handleReview($event)"
          :bib-data="entry"
          :keywords="keywords"
          :updating="updating.includes(entry.key)"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ReviwedEntry } from 'src/components/models'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import EntryCard from 'src/components/EntryCard.vue'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import joinAuthors from 'src/utils/joinAuthors'
import axios from 'axios'

class KeyedEntries {
  private entries: Record<string, ReviwedEntry> = {}

  constructor (entries: ReviwedEntry[]) {
    entries.forEach(entry => {
      this.entries[entry.key] = entry
    })
  }

  get (key: string): ReviwedEntry | undefined {
    return this.entries[key]
  }

  set (key: string, entry: ReviwedEntry) {
    this.entries[key] = entry
  }

  delete (key: string) {
    delete this.entries[key]
  }

  public toArray (): ReviwedEntry[] {
    return Object.values(this.entries)
  }
}

const bibfile = ref<File | null>(null)
const bibliography = ref<KeyedEntries>()
const keywords = ref<string[]>([])
const filter = ref(false)
const user = useCurrentUser()
const auth = useFirebaseAuth()
const updating = ref<string[]>([])

const { t } = useI18n()
const { loading } = useQuasar()

const filteredEntries = computed<KeyedEntries>(() => {
  if (!bibliography.value) return {} as KeyedEntries

  if (keywords.value.length === 0) return bibliography.value

  const filtered = bibliography.value?.toArray().filter(entry => {
    let hasTerm = false

    keywords.value.forEach(keyword => {
      const pattern = RegExp('\\b' + keyword + '\\b', 'gi')

      hasTerm = hasTerm || pattern.test(entry.fields.abstract ? entry.fields.abstract : '')
      hasTerm = hasTerm || pattern.test(entry.fields.title ? entry.fields.title : '')
      hasTerm = hasTerm || pattern.test(entry.fields.keywords ? entry.fields.keywords.join(' ') : '')
    })

    return hasTerm
  })

  return new KeyedEntries(filtered)
})

async function handleFile ($event: SubmitEvent | Event) {
  const data = new FormData(($event.target as HTMLFormElement))

  if (data.has('file')) {
    loading.show()
    const response = await axios.post<ReviwedEntry[]>(`${import.meta.env.VITE_API_URL}/bibtex`, data, {
      headers: {
        Authorization: `Bearer ${await user.value?.getIdToken()}`
      }
    })
    loading.hide()
    // console.log(response)

    const keyedEntries: {
      [key: string]: ReviwedEntry
    } = {}

    response.data.forEach(entry => {
      keyedEntries[entry.key] = entry
    })

    console.log(keyedEntries)

    bibliography.value = new KeyedEntries(response.data)
    console.log(bibliography.value)
  }
}

function exportData (fileType: 'csv' | 'bib') {
  let textData = ''
  const dataset = filter.value ? filteredEntries.value : bibliography.value

  if (fileType === 'csv') {
    textData += t('export.csvHeader')

    dataset?.toArray().forEach((_entry: ReviwedEntry) => {
      const entry = _entry.fields
      console.log(entry)
      const title = entry.title || t('export.missing')
      const DOI = entry.doi || t('export.missing')
      const abstract = entry.abstract || t('export.missing')
      const author = joinAuthors(entry.author) || t('export.missing')
      const year = entry.year || t('export.missing')
      const keywords = entry.keywords?.join(', ') || t('export.missing')
      let URL, accepted

      if (_entry.accepted === 'null') {
        accepted = ' '
      } else if (_entry.accepted) {
        console.log(entry)
        accepted = t('filtering.accepted')
      } else {
        accepted = t('filtering.rejected')
      }

      if (entry.URL) {
        URL = entry.url
      } else if (entry.doi) {
        URL = `https://doi.org/${entry.doi}`
      } else {
        URL = t('export.missing')
      }

      const csvline = `"${title.replaceAll('"', '""')}","${year}","${author}","${keywords}","${URL}","${abstract.replaceAll('"', '""')}","${DOI}","${accepted}"\n`
      textData += csvline
    })
  } else {
    dataset?.toArray().forEach(entry => {
      textData += entry.input + '\n\n'
    })
  }

  const blob = new Blob([textData], { type: `text/${fileType === 'csv' ? 'csv' : 'bib'}` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export.${fileType}`
  a.click()
}

async function getBibdata () {
  loading.show({
    message: 'Loading your bibliography...'
  })
  const response = await axios.get<ReviwedEntry[]>(`${import.meta.env.VITE_API_URL}/bibtex`, {
    headers: {
      Authorization: `Bearer ${await user.value?.getIdToken()}`
    }
  })

  const keyedEntries: {
    [key: string]: ReviwedEntry
  } = {}

  response.data?.forEach(entry => {
    keyedEntries[entry.key] = entry
  })

  console.log(keyedEntries)

  bibliography.value = new KeyedEntries(response.data)
}

async function handleReview ($event: { key: string, accepted: boolean }) {
  const entry = bibliography.value?.get($event.key)
  updating.value.push($event.key)

  axios.post(`${import.meta.env.VITE_API_URL}/review`, {
    key: $event.key,
    accepted: $event.accepted
  }, {
    headers: {
      Authorization: `Bearer ${await user.value?.getIdToken()}`
    }
  })
    .then(res => {
      if (res.data.message === 'ok') {
        updating.value = updating.value.filter(key => key !== $event.key)
        if (entry) {
          entry.accepted = $event.accepted
          bibliography.value?.set($event.key, entry)
        }
      }
    })
}

const retry = setInterval(() => {
  if (auth !== undefined) {
    getBibdata()
      .then(() => {
        clearInterval(retry)
        loading.hide()
      })
      .catch(err => {
        console.log(`Failed to fetch history: ${err}, trying again`)
      })
  }
}, 3000)
</script>
