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
          :label="$t('upload.button')"
        />

        <q-toggle
          v-model="filter"
          :label="$t('filtering.prompt')"
        />

        <q-space />

        <q-btn-dropdown
          color="green"
          type="button"
          :label="$t('filtering.prompt')"
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
        v-for="entry in filter ? filteredEntries : entries"
        :key="entry['citation-key']"
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
import { Cite } from '@citation-js/core'
import EntryCard from 'src/components/EntryCard.vue'
import '@citation-js/plugin-bibjson'
import { BibEntry } from 'src/components/models'
import joinAuthors from 'src/utils/joinAuthors'

const bibfile = ref<File | null>(null)
const entries = ref<BibEntry[]>([])
const keywords = ref<string[]>([])
const filter = ref(false)

const filteredEntries = computed<BibEntry[]>(() => {
  if (keywords.value.length === 0) return entries.value

  return entries.value.filter(entry => {
    let hasTerm = false

    keywords.value.forEach(keyword => {
      const pattern = RegExp('\\b' + keyword + '\\b', 'gi')

      hasTerm = hasTerm || pattern.test(entry.abstract)
      hasTerm = hasTerm || pattern.test(entry.title)
      hasTerm = hasTerm || pattern.test(entry.keyword)
    })

    return hasTerm
  })
})

function handleFile ($event: SubmitEvent | Event) {
  const data = new FormData(($event.target as HTMLFormElement))

  if (data.has('file')) {
    const reader = new FileReader()
    let bibText = ''

    reader.readAsText((data.get('file') as Blob), 'utf-8')

    reader.onload = (evt) => {
      bibText = evt.target?.result?.toString() || ''
      entries.value = new Cite(bibText).get()
      // console.log(Cite(bibText), new Cite(bibText, { target: '@biblatex/entries+list' }))
    }
  }
}

function exportData (fileType: 'csv' | 'bib') {
  let textData = ''
  const dataset = filter.value ? filteredEntries : entries

  if (fileType === 'csv') {
    textData += '"title","year","author","keywords","url","abstract","doi"\n'

    dataset.value.forEach(entry => {
      const title = entry.title || 'Não consta'
      const DOI = entry.DOI || 'Não consta'
      const abstract = entry.abstract || 'Não consta'
      const author = joinAuthors(entry.author) || 'Não consta'
      const URL = entry.URL ? entry.URL : entry.DOI ? `https://doi.org/${entry.DOI}` : 'Não consta'
      const year = entry.issued['date-parts'][0][0] || 'Não consta'
      const keyword = entry.keyword || 'Não consta'

      const csvline = `"${title.replaceAll('"', '""')}","${year}","${author}","${keyword}","${URL}","${abstract.replaceAll('"', '""')}","${DOI}"\n`
      textData += csvline
    })
  } else {
    dataset.value.forEach(entry => {
      textData += new Cite(entry).format('biblatex')
    })
  }

  const blob = new Blob([textData], { type: `text/${fileType === 'csv' ? 'csv' : 'bib'}` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export.${fileType}`
  a.click()
}
</script>
