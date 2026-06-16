import {
    AppstoreOutlined,
    TeamOutlined,
    HeartOutlined,
    FormOutlined,
    CalendarOutlined,
    SolutionOutlined,
    HistoryOutlined,
} from '@ant-design/icons-vue'

export interface menu {
    header?: string
    title?: string
    icon?: object
    to?: string
    divider?: boolean
    chip?: string
    chipColor?: string
    chipVariant?: string
    chipIcon?: string
    children?: menu[]
    disabled?: boolean
    type?: string
    subCaption?: string
}

const nurseSidebarItem: menu[] = [
    {
        header: 'Dashboard',
    },
    {
        title: 'Dashboard',
        icon: AppstoreOutlined,
        to: '/nurse/dashboard',
    },
    {
        header: 'Nurse Care',
    },
    {
        title: 'Patients',
        icon: TeamOutlined,
        to: '/nurse/patients',
    },
    {
        title: 'Vital Input',
        icon: HeartOutlined,
        to: '/nurse/vitals',
    },
    {
        title: 'Care Notes',
        icon: FormOutlined,
        to: '/nurse/care-notes',
    },
    {
        title: 'Procedure Schedule',
        icon: CalendarOutlined,
        to: '/nurse/procedures',
    },
    {
        title: 'Monitoring',
        icon: SolutionOutlined,
        to: '/nurse/monitoring',
    },
    {
        header: 'Logs',
    },
    {
        title: 'Activity Log',
        icon: HistoryOutlined,
        to: '/nurse/log-activity',
    }
]

export default nurseSidebarItem
