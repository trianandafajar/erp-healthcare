<script setup lang="ts">
import { shallowRef } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import {
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  BuildOutlined,
  CreditCardOutlined,
  CommentOutlined,
  DollarOutlined,
  HistoryOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue';
import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoDark.vue';

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
const sidebarMenu = shallowRef<MenuItem[]>([
  { header: 'Dashboard' },
  { title: 'Dashboard', icon: AppstoreOutlined, to: `/super-admin/dashboard` },

  { header: 'Management' },
  { title: 'Tenants', icon: TeamOutlined, to: `/super-admin/tenants` },
  { title: 'Users', icon: UserOutlined, to: `/super-admin/users-management` },
  { title: 'Subscriptions', icon: CreditCardOutlined, to: `/super-admin/subscriptions` },

   { header: 'Landingpage' },
   { title: 'Industries', icon: BuildOutlined, to: `/super-admin/landingpage/industries` },
   { title: 'Sponsors', icon: PictureOutlined, to: `/super-admin/landingpage/logos` },
   { title: 'Testimonials', icon: CommentOutlined, to: `/super-admin/landingpage/testimonials` },
   { title: 'Pricing', icon: DollarOutlined, to: `/super-admin/landingpage/pricing` },

   { header: 'System' },
   { title: 'Activity Log', icon: HistoryOutlined, to: `/super-admin/activity-log` },
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
