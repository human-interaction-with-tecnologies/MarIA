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
          v-model="filter"
          :label="$t('filtering.prompt')"
        />

        <q-space />

        <!-- <q-btn-dropdown
          color="green"
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
        </q-btn-dropdown> -->
      </div>
    </q-form>

    <!-- <div class="row q-mt-sm q-col-gutter-md">
      <div
        class="col-6"
        v-for="entry in filteredEntries"
        :key="entry['citation-key']"
      >
        <entry-card
          class="fit"
          :bib-data="entry"
          :keywords="keywords"
          @reject="entry.accepted = false"
          @accept="entry.accepted = true"
        />
      </div>
    </div> -->
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// import { Cite } from '@citation-js/core'
import { type Bibliography, promises } from '@retorquere/bibtex-parser'
import { useWebWorkerFn } from '@vueuse/core'
// import EntryCard from 'src/components/EntryCard.vue'
// import joinAuthors from 'src/utils/joinAuthors'
// import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios from 'axios'
// import axios from 'axios'

const bibfile = ref<File | null>(null)
const entries = ref<Bibliography>()
const keywords = ref<string[]>([])
const filter = ref(false)

// const { t } = useI18n()
const { loading } = useQuasar()

// const filteredEntries = computed<BibEntry[]>(() => {
//   if (keywords.value.length === 0) return entries.value

//   return entries.value.filter(entry => {
//     let hasTerm = false

//     keywords.value.forEach(keyword => {
//       const pattern = RegExp('\\b' + keyword + '\\b', 'gi')

//       hasTerm = hasTerm || pattern.test(entry.abstract)
//       hasTerm = hasTerm || pattern.test(entry.title)
//       hasTerm = hasTerm || pattern.test(entry.keyword)
//     })

//     return hasTerm
//   })
// })

async function handleFile ($event: SubmitEvent | Event) {
  const data = new FormData(($event.target as HTMLFormElement))

  if (data.has('file')) {
    loading.show()
    const _data = await axios.post('http://localhost:3000/parse', data)
    loading.hide()

    console.log(_data)
  }
}

// function exportData (fileType: 'csv' | 'bib') {
//   let textData = ''
//   const dataset = filter.value ? filteredEntries : entries

//   if (fileType === 'csv') {
//     textData += '"title","year","author","keywords","url","abstract","doi"\n'

//     dataset.value.forEach(entry => {
//       const title = entry.title || t('export.missing')
//       const DOI = entry.DOI || t('export.missing')
//       const abstract = entry.abstract || t('export.missing')
//       const author = joinAuthors(entry.author) || t('export.missing')
//       const URL = entry.URL ? entry.URL : entry.DOI ? 'https://doi.org/{entry.DOI}' : t('export.missing')
//       const year = entry.issued['date-parts'][0][0] || t('export.missing')
//       const keyword = entry.keyword || t('export.missing')

//       const csvline = `"${title.replaceAll('"', '""')}","${year}","${author}","${keyword}","${URL}","${abstract.replaceAll('"', '""')}","${DOI}"\n`
//       textData += csvline
//     })
//   } else {
//     dataset.value.forEach(entry => {
//       textData += new Cite(entry).format('biblatex')
//     })
//   }

//   const blob = new Blob([textData], { type: `text/${fileType === 'csv' ? 'csv' : 'bib'}` })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = `export.${fileType}`
//   a.click()
// }
</script>
