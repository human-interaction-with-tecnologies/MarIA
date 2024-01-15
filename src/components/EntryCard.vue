<template>
  <q-card class="entry-card  column">
    <q-card-section class="text-h5">
      <a
        target="_blank"
        rel="noreferrer"
        :href="bibData.URL"
      >
        <span v-html="highlight(bibData.title)" />

        <q-icon class="q-ml-xs" name="mdi-open-in-new" />
      </a>

        ({{ bibData.issued['date-parts'][0][0] }})
    </q-card-section>

    <q-separator />

    <q-card-section>
      {{ $t('paperCard.authors') }}: {{ joinAuthors(bibData.author) }}
    </q-card-section>

    <q-card-section class="highlight">
      {{ $t('paperCard.abstract') }}: <span v-html="highlight(bibData.abstract)" />
    </q-card-section>

    <q-card-section class="highlight">
      {{ $t(`paperCard.keywords`) }}: <span v-html="highlight(bibData.keyword)" />
    </q-card-section>

    <q-space />

    <q-separator />

    <q-card-actions>
      <q-icon
        name="mdi-close"
        color="negative"
        size="35px"
        v-if="bibData.accepted === false"
        />

      <q-icon
        name="mdi-check"
        color="positive"
        size="35px"
        v-if="bibData.accepted === true"
      />

      <q-space />

      <q-btn
        color="negative"
        icon="mdi-cancel"
        :label="$t(`filtering.reject`)"
        @click="$emit('reject', bibData.id)"
      />

      <q-btn
        color="positive"
        icon="mdi-check"
        :label="$t(`filtering.accept`)"
        @click="$emit('accept', bibData.id)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { BibEntry } from './models'
import Validator from 'validator'
import joinAuthors from 'src/utils/joinAuthors'
import '@citation-js/plugin-bibtex'

interface Props {
  bibData: BibEntry
  keywords: string[]
}

const props = defineProps<Props>()

defineEmits(['accept', 'reject'])

function highlight (field: string) {
  if (!field) return

  field = Validator.escape(field)

  if (props.keywords.length === 0) return field

  props.keywords.forEach(keyword => {
    const pattern = RegExp('\\b' + keyword + '\\b', 'gi')

    field = field.replace(pattern, match => `<span class="term">${match}</span>`)
  })

  return field
}
</script>

<style lang="scss">
.term {
  color: red;
  font-weight: bold;
}

.highlight {
  .term {
    font-size: 1.2em
  }
}
</style>
