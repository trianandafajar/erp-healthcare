<script setup lang="ts">
const menuGroups = [
  { header: 'Dashboard', items: 1 },
  { header: 'Management', items: 3 },
  { header: 'Landingpage', items: 5 },
  { header: 'System', items: 3 },
]
</script>

<template>
  <v-app>
    <NuxtLoadingIndicator color="#176D37" :height="4" />
    <v-navigation-drawer :model-value="true" permanent elevation="0" rail-width="60" class="leftSidebar" width="260">
      <div class="pa-5">
        <div class="logo">
          <div class="d-flex align-center ga-2">
            <div class="v-skeleton-loader v-skeleton-loader--rounded bg-transparent"
              style="width:36px;height:36px;flex-shrink:0">
              <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
            </div>
            <div class="v-skeleton-loader bg-transparent" style="width:110px;height:20px">
              <div class="v-skeleton-loader__bone v-skeleton-loader__text" />
            </div>
          </div>
        </div>
      </div>
      <div class="scrollnavbar">
        <v-list>
          <template v-for="(group, gi) in menuGroups" :key="'g' + gi">
            <v-list-subheader color="lightText" class="smallCap text-subtitle-2"
              style="padding:0 0 0 20px!important;min-height:32px;display:flex;align-items:center;opacity:1">
              <div class="v-skeleton-loader bg-transparent" style="width:70px;height:12px;display:inline-block">
                <div class="v-skeleton-loader__bone v-skeleton-loader__text" style="height:100%;margin:0" />
              </div>
            </v-list-subheader>
            <v-list-item v-for="n in group.items" :key="'g' + gi + '-i' + n" rounded class="mb-1" color="primary">
              <template #prepend>
                <div class="v-skeleton-loader bg-transparent" style="width:24px;height:24px;flex-shrink:0">
                  <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
                </div>
              </template>
              <v-list-item-title style="opacity:1">
                <div class="v-skeleton-loader bg-transparent" style="width:120px;height:14px;display:inline-block">
                  <div class="v-skeleton-loader__bone v-skeleton-loader__text" style="height:100%;margin:0" />
                </div>
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
        <div class="pa-4" />
      </div>
    </v-navigation-drawer>

    <v-app-bar elevation="0" height="60">
      <div class="v-skeleton-loader bg-transparent ml-3" style="width:36px;height:36px">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
      </div>
      <v-spacer />
      <div class="v-skeleton-loader bg-transparent mr-2" style="width:36px;height:36px">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
      </div>
      <div class="d-flex align-center mr-4">
        <div class="v-skeleton-loader v-skeleton-loader--rounded bg-transparent mr-2" style="width:34px;height:34px">
          <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
        </div>
        <div class="v-skeleton-loader bg-transparent d-none d-sm-block" style="width:100px;height:16px">
          <div class="v-skeleton-loader__bone v-skeleton-loader__text" />
        </div>
      </div>
    </v-app-bar>

    <v-main class="page-wrapper">
      <v-container fluid class="d-flex flex-column ga-4">
        <div class="v-skeleton-loader v-skeleton-loader--rounded bg-transparent" style="width:100%;height:60px">
          <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
        </div>

        <div class="v-skeleton-loader v-skeleton-loader--rounded bg-transparent" style="width:100%;height:500px">
          <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
        </div>

        <div class="v-skeleton-loader v-skeleton-loader--rounded bg-transparent" style="width:100%;height:50px">
          <div class="v-skeleton-loader__bone v-skeleton-loader__image" />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.leftSidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.page-wrapper {
  min-height: 100vh;
}

.v-skeleton-loader {
  vertical-align: middle;
}

.v-skeleton-loader__image {
  height: 100%;
}
</style>