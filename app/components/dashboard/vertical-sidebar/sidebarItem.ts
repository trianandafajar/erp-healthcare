// icons
import {
  AppstoreOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ApartmentOutlined,
} from '@ant-design/icons-vue';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: 'Dashboard' },
  {
    title: 'Dashboard',
    icon: AppstoreOutlined,
    to: '/dashboard'
  },
  { header: 'User Management' },
  {
    title: 'Users',
    icon: UserOutlined,
    to: '/users-management'
  },
  { header: 'Role & Permission' },
  {
    title: 'Permissions',
    icon: KeyOutlined,
    to: '/permissions'
  },
  {
    title: 'Roles',
    icon: SafetyCertificateOutlined,
    to: '/roles'
  },
  { header: 'Departments' },
  {
    title: 'Department',
    icon: ApartmentOutlined,
    to: '/departments'
  },
];

export default sidebarItem;
