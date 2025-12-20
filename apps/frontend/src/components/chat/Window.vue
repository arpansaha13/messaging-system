<template>
  <UCard
    :ui="{
      root: 'h-full flex flex-col',
      // https://stackoverflow.com/questions/18614301/keep-overflow-div-scrolled-to-bottom-unless-user-scrolls-up
      body: 'sm:px-20 sm:py-4 mt-auto scrollbar overflow-y-scroll flex flex-col-reverse',
    }"
  >
    <template #header>
      <slot name="header" />
    </template>

    <slot />

    <template #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
