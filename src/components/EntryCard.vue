<template>
  <q-card class="entry-card  column">
    <q-card-section class="text-h5">
      {{ bibData.title }}
    </q-card-section>

    <q-separator />

    <q-card-section>
      Autores: {{ joinAuthors(bibData.author) }}
    </q-card-section>

    <q-card-section>
      Abstract: {{ bibData.abstract }}
    </q-card-section>

    <q-space />

    <q-separator />

    <q-card-actions>
      <q-btn
        align="right"
        color="black"
        :href="`https://doi.org/${bibData.DOI}`"
        target="_blank"
        rel="noreferrer"
        label="Visitar"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { BibEntry, Author } from './models'

function joinAuthors (authors: Author[]) {
  return authors.reduce((accumulator: string, currAuthor: Author) => {
    return ` ${accumulator} ${currAuthor.given} ${currAuthor.family},`
  }, '').slice(0, -1)
}

interface Props {
  bibData: BibEntry
}

defineProps<Props>()
</script>
