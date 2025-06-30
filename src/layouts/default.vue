<template>
  <router-view>
    <template #default="{ Component }">
      <transition name="zoom-fade" mode="out-in" appear>
        <component :is="Component" />
      </transition>
    </template>
  </router-view>
</template>
