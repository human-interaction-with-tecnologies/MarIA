<template>
  <q-card :class="{
    'disabled': updating,
    'entry-card column': true
  }">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
      <q-spinner v-if="updating" size="200px" />
    </div>
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
      <q-card-section>
        {{ $t('paperCard.authors') }}: {{ joinAuthors(bibData.fields.author) }}
      </q-card-section>

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
      <template v-if="bibData?.accepted != 'null'">
        <span
          :class="{
            'q-ml-md text-bold': true,
            'text-negative': !bibData.accepted,
            'text-positive': bibData.accepted
          }"
        >
          {{ $t(`filtering.${bibData.accepted ? 'accepted' : 'rejected'}`) }}
        </span>
      </template>

      <q-space />

      <q-btn
        color="negative"
        icon="mdi-cancel"
        :label="$t(`filtering.reject`)"
        @click="$emit('review', { key: bibData.key, accepted: false })"
      />

      <q-btn
        color="positive"
        icon="mdi-check"
        :label="$t(`filtering.accept`)"
        @click="$emit('review', { key: bibData.key, accepted: true })"
        />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ReviwedEntry } from './models'
import Validator from 'validator'
import joinAuthors from 'src/utils/joinAuthors'
import '@citation-js/plugin-bibtex'

interface Props {
  bibData: ReviwedEntry
  keywords: string[]
  updating: boolean
}

const props = defineProps<Props>()

defineEmits<{
  review: [status: { key: string; accepted: boolean }]
}>()

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
