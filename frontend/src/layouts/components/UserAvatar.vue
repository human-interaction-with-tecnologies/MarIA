<template>
  <q-avatar
    color="blue-grey-3"
    :size="size"
  >
    <img
      v-if="user"
      :src="`${user.photoURL}`"
      :alt="`${user.displayName}`"
    />

    <q-icon
      v-else
      name="mdi-account"
      color="blue-grey-4"
    />
  </q-avatar>
</template>

<script setup lang="ts">
import { useCurrentUser } from 'vuefire'

const user = useCurrentUser()

withDefaults(defineProps<{
  size?: string
}>(), {
  size: 'lg'
})
</script>
