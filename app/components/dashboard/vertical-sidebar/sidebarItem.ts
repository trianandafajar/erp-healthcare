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
  SettingOutlined,
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

export function getSidebarItems(slug: string): menu[] {
  const base = `/${slug}`

  return [
    { header: 'Dashboard' },
    { title: 'Dashboard', icon: AppstoreOutlined, to: `${base}/dashboard` },

    { header: 'Reports' },
    { title: 'Reports', icon: BarChartOutlined, to: `${base}/reports` },

    { header: 'Master Data' },
    { title: 'Departments', icon: ApartmentOutlined, to: `${base}/departments` },
    { title: 'Doctors', icon: MedicineBoxOutlined, to: `${base}/doctors` },
    { title: 'Nurses', icon: UsergroupAddOutlined, to: `${base}/nurses` },
    { title: 'Patient', icon: SolutionOutlined, to: `${base}/patients` },
    { title: 'Pharmacy', icon: MedicineBoxOutlined, to: `${base}/pharmacies` },
    { title: 'Receptionist', icon: TeamOutlined, to: `${base}/receptionists` },

    { header: 'Access Management' },
    { title: 'Users', icon: TeamOutlined, to: `${base}/users-management` },
    { title: 'Roles', icon: SafetyCertificateOutlined, to: `${base}/roles` },
    { title: 'Permissions', icon: KeyOutlined, to: `${base}/permissions` },

    { header: 'Log' },
    { title: 'Log Activity', icon: HistoryOutlined, to: `${base}/log-activity` },

    { header: 'Settings' },
    { title: 'Settings', icon: SettingOutlined, to: `${base}/settings` },
  ]
}