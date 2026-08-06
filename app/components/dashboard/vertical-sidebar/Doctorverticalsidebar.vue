<script setup lang="ts">
import { shallowRef } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import {
  AppstoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  AuditOutlined,
  ShareAltOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue';
import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoDark.vue';
import { useAuthStore } from '~/stores/auth';

type MenuItem = {
  header?: string
  title?: string
  icon?: object
  to?: string
  divider?: boolean
  chip?: string
  chipColor?: string
  chipVariant?: string
  chipIcon?: string
  children?: MenuItem[]
  disabled?: boolean
  type?: string
  subCaption?: string
}

const customizer = useCustomizerStore();
const authStore = useAuthStore();
const route = useRoute();
const slug = (route.params.slug as string) || authStore.tenantSlug;

const sidebarMenu = shallowRef<MenuItem[]>([
  {
    header: 'Dashboard',
  },
  {
    title: 'Dashboard',
    icon: AppstoreOutlined,
    to: `/${slug}/doctor/dashboard`,
  },
  {
    header: 'Practice',
  },
  {
    title: 'My Schedule',
    icon: CalendarOutlined,
    to: `/${slug}/doctor/schedule`,
  },
  {
    title: 'Appointments Calendar',
    icon: CalendarOutlined,
    to: `/${slug}/doctor/appointments`,
  },
  {
    title: "Today's Patients",
    icon: TeamOutlined,
    to: `/${slug}/doctor/patients/today`,
  },
  {
    title: 'Patient History',
    icon: HistoryOutlined,
    to: `/${slug}/doctor/patients/history`,
  },
  {
    header: 'Medical',
  },
  {
    title: 'Examination',
    icon: AuditOutlined,
    to: `/${slug}/doctor/examination`,
  },
  {
    title: 'Medical Records',
    icon: FileTextOutlined,
    to: `/${slug}/doctor/medical-records`,
  },
  {
    title: 'Referrals',
    icon: ShareAltOutlined,
    to: `/${slug}/doctor/referrals`,
  },
]);
</script>

<template>
  <v-navigation-drawer left v-model="customizer.Sidebar_drawer" elevation="0" rail-width="60" mobile-breakpoint="lg" app
    class="leftSidebar" :rail="customizer.mini_sidebar" expand-on-hover>
    <div class="pa-5">
      <Logo />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <div class="scrollnavbar">
      <v-list aria-busy="true" aria-label="menu list">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroup :item="item" v-if="item.header" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider" />
          <!---If Has Child -->
          <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <NavItem :item="item" v-else />
          <!---End Single Item-->
        </template>
      </v-list>
      <div class="pa-4">
        <!-- <ExtraBox /> -->
      </div>
    </div>
  </v-navigation-drawer>
</template>
