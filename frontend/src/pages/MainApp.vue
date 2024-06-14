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
        v-for="entry in (filter ? filteredEntries : bibliography)"
        :key="entry.key"
      >
        <entry-card
          class="fit"
          :bib-data="entry"
          :keywords="keywords"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Entry } from '@retorquere/bibtex-parser'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import EntryCard from 'src/components/EntryCard.vue'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import joinAuthors from 'src/utils/joinAuthors'
import axios from 'axios'

const bibfile = ref<File | null>(null)
const bibliography = ref<Entry[]>()
const keywords = ref<string[]>([])
const filter = ref(false)
const user = useCurrentUser()
const auth = useFirebaseAuth()

const { t } = useI18n()
const { loading } = useQuasar()

const filteredEntries = computed<Entry[]>(() => {
  if (!bibliography.value) return [] as Entry[]

  if (keywords.value.length === 0) return bibliography.value

  return bibliography.value?.filter(entry => {
    let hasTerm = false

    keywords.value.forEach(keyword => {
      const pattern = RegExp('\\b' + keyword + '\\b', 'gi')

      hasTerm = hasTerm || pattern.test(entry.fields.abstract ? entry.fields.abstract : '')
      hasTerm = hasTerm || pattern.test(entry.fields.title ? entry.fields.title : '')
      hasTerm = hasTerm || pattern.test(entry.fields.keywords ? entry.fields.keywords.join(' ') : '')
    })

    return hasTerm
  })
})

async function handleFile ($event: SubmitEvent | Event) {
  const data = new FormData(($event.target as HTMLFormElement))

  if (data.has('file')) {
    loading.show()
    const response = await axios.post<Entry[]>(`${import.meta.env.VITE_API_URL}/bibtex`, data, {
      headers: {
        Authorization: `Bearer ${await user.value?.getIdToken()}`
      }
    })
    loading.hide()
    // console.log(response)

    bibliography.value = response.data
    console.log(bibliography.value)
  }
}

function exportData (fileType: 'csv' | 'bib') {
  let textData = ''
  const dataset = filter.value ? filteredEntries.value : bibliography.value

  if (fileType === 'csv') {
    textData += '"title","year","author","keywords","url","abstract","doi"\n'

    dataset?.forEach((_entry: Entry) => {
      const entry = _entry.fields
      const title = entry.title || t('export.missing')
      const DOI = entry.DOI || t('export.missing')
      const abstract = entry.abstract || t('export.missing')
      const author = joinAuthors(entry.author) || t('export.missing')
      const URL = entry.URL ? entry.URL : entry.DOI ? 'https://doi.org/{entry.DOI}' : t('export.missing')
      const year = entry.year || t('export.missing')
      const keyword = entry.keyword || t('export.missing')

      const csvline = `"${title.replaceAll('"', '""')}","${year}","${author}","${keyword}","${URL}","${abstract.replaceAll('"', '""')}","${DOI}"\n`
      textData += csvline
    })
  } else {
    dataset?.forEach(entry => {
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
  const response = await axios.get<Entry[]>(`${import.meta.env.VITE_API_URL}/bibtex`, {
    headers: {
      Authorization: `Bearer ${await user.value?.getIdToken()}`
    }
  })

  bibliography.value = response.data
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
