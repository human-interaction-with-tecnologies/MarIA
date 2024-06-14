<template>
  <q-card class="entry-card  column">
    <q-card-section class="text-h5">
      <a
        target="_blank"
        rel="noreferrer"
        :href="`https://doi.org/${bibData.key}`"
      >
        <span v-if="bibData.type === 'proceedings'">{{ $t(`entryTypes.${bibData.type}`) }} - </span>

        <span v-html="highlight(bibData.fields.title)" />

        <q-icon class="q-ml-xs" name="mdi-open-in-new" />
      </a>

        ({{ bibData.fields.year }})
    </q-card-section>

    <q-separator v-if="bibData.type !== 'proceedings'" />

    <template v-if="bibData.type !== 'proceedings'">
      <!-- <q-card-section>
        {{ $t('paperCard.authors') }}: {{ joinAuthors(bibData.creators.author) }}
      </q-card-section> -->

      <q-card-section class="highlight">
        {{ $t('paperCard.abstract') }}: <span v-html="highlight(bibData.fields.abstract ? bibData.fields.abstract : $t('paperCard.missing.abstract'))" />
      </q-card-section>

      <q-card-section class="highlight">
        {{ $t('paperCard.keywords') }}: <span v-html="highlight(bibData.fields.keywords ? bibData.fields.keywords.join(', ') : $t('paperCard.missing.keywords'))" />
      </q-card-section>
    </template>

    <q-space />

    <q-separator />

    <q-card-actions>
      <!-- <q-icon
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
      /> -->

      <q-space />

      <q-btn
        color="negative"
        icon="mdi-cancel"
        :label="$t(`filtering.reject`)"
        @click="$emit('reject', bibData.key)"
      />

      <q-btn
        color="positive"
        icon="mdi-check"
        :label="$t(`filtering.accept`)"
        @click="$emit('accept', bibData.key)"
        />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { type Entry } from '@retorquere/bibtex-parser'
import Validator from 'validator'
import joinAuthors from 'src/utils/joinAuthors'
import '@citation-js/plugin-bibtex'

interface Props {
  bibData: Entry
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
