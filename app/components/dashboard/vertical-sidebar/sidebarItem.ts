// icons
import {
  AppstoreOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ApartmentOutlined,
  MedicineBoxOutlined,
  UsergroupAddOutlined,
  SolutionOutlined,
  HistoryOutlined,
  BarChartOutlined,
  BuildOutlined,
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
  {
    header: 'Dashboard'
  },
  {
    title: 'Dashboard',
    icon: AppstoreOutlined,
    to: '/dashboard'
  },

  {
    header: 'Reports'
  },
  {
    title: 'Reports',
    icon: BarChartOutlined,
    to: '/reports'
  },

  {
    header: 'Master Data'
  },
  {
    title: 'Departments',
    icon: ApartmentOutlined,
    to: '/departments'
  },
  {
    title: 'Doctors',
    icon: MedicineBoxOutlined,
    to: '/doctors'
  },
  {
    title: 'Nurses',
    icon: UsergroupAddOutlined,
    to: '/nurses'
  },
  {
    title: 'Patient',
    icon: SolutionOutlined,
    to: '/patients'
  },

  {
    header: 'Access Management'
  },
  {
    title: 'Users',
    icon: TeamOutlined,
    to: '/users-management'
  },
  {
    title: 'Roles',
    icon: SafetyCertificateOutlined,
    to: '/roles'
  },
  {
    title: 'Permissions',
    icon: KeyOutlined,
    to: '/permissions'
  },
  {
    header: 'Landing Page'
  },
  {
    title: 'Industries',
    icon: BuildOutlined,
    to: '/landingpage/industries'
  },

  {
    header: 'Log'
  },
  {
    title: 'Log Activity',
    icon: HistoryOutlined,
    to: '/log-activity'
  },
]

export default sidebarItem;