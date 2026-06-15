import {
    AppstoreOutlined,
    CalendarOutlined,
    TeamOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    AuditOutlined,
    ShareAltOutlined,
    HistoryOutlined,
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

const doctorSidebarItem: menu[] = [
    {
        header: 'Dashboard'
    },
    {
        title: 'Dashboard',
        icon: AppstoreOutlined,
        to: '/doctor/dashboard'
    },

    {
        header: 'Practice'
    },
    {
        title: 'My Schedule',
        icon: CalendarOutlined,
        to: '/doctor/schedule'
    },
    {
        title: "Today's Patients",
        icon: TeamOutlined,
        to: '/doctor/patients/today'
    },
    {
        title: 'Patient History',
        icon: HistoryOutlined,
        to: '/doctor/patients/history'
    },

    {
        header: 'Medical'
    },
    {
        title: 'Examination',
        icon: AuditOutlined,
        to: '/doctor/examination'
    },
    {
        title: 'Prescriptions',
        icon: MedicineBoxOutlined,
        to: '/doctor/prescriptions'
    },
    {
        title: 'Medical Records',
        icon: FileTextOutlined,
        to: '/doctor/medical-records'
    },
    {
        title: 'Referrals',
        icon: ShareAltOutlined,
        to: '/doctor/referrals'
    },
]

export default doctorSidebarItem;