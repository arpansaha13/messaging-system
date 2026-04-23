<template>
  <SocketProvider>
    <div class="flex h-screen bg-gray-200 dark:bg-gray-900">
      <Navbar />

      <div class="grow">
        <slot />
      </div>
    </div>
  </SocketProvider>
</template>
