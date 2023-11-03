<template>
  <q-page padding>
    <q-form @submit.prevent="handleFile($event)">
      <q-file
        v-model="bibfile"
        accept=".bib"
        name="file"
        :label="$t('upload.prompt')"
        :rules="[
          val => !!val || 'Campo obrigatorio'
        ]"
      />

      <q-select
        v-model="keywords"
        label="Palavras Chave"
        :options="[]"
        new-value-mode="add-unique"
        use-input
        use-chips
        hide-dropdown-icon
        multiple
      />

      {{ keywords }}

      <q-btn
        color="primary"
        type="submit"
        label="enviar"
      />
    </q-form>

    <div class="row q-mt-sm q-col-gutter-md">
      <div
        class="col-6"
        v-for="entry in entries"
        :key="entry['citation-key']"
      >
        <entry-card
          class="fit"
          :bib-data="entry"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cite } from '@citation-js/core'
import '@citation-js/plugin-bibtex'
import EntryCard from 'src/components/EntryCard.vue'
import { BibEntry } from 'src/components/models'

const bibfile = ref<File | null>(null)
const entries = ref<BibEntry[]>([])
const keywords = ref<string[]>([])

function handleFile ($event: SubmitEvent | Event) {
  const data = new FormData(($event.target as HTMLFormElement))

  if (data.has('file')) {
    const reader = new FileReader()
    let bibText = ''

    reader.readAsText((data.get('file') as Blob), 'utf-8')
    console.log(data.get('file'))

    reader.onload = (evt) => {
      bibText = evt.target?.result?.toString() || ''
      entries.value = new Cite(bibText).data
    }
  }
}
</script>
