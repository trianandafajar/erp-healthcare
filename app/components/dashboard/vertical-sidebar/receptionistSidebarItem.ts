import {
    AppstoreOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    FileDoneOutlined,
    FileTextOutlined,
    ScheduleOutlined,
    TeamOutlined,
    UserAddOutlined,
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

const receptionistSidebarItem: menu[] = [
    {
        header: 'Dashboard',
    },
    {
        title: 'Dashboard',
        icon: AppstoreOutlined,
        to: '/receptionist/dashboard',
    },
    {
        header: 'Patient Services',
    },
    {
        title: 'Patient Registration',
        icon: UserAddOutlined,
        to: '/receptionist/patients/register',
    },
    {
        title: 'Appointment',
        icon: CalendarOutlined,
        to: '/receptionist/appointments',
    },
    {
        title: 'Patient Check-in',
        icon: FileDoneOutlined,
        to: '/receptionist/check-in',
    },
    {
        header: 'Queue',
    },
    {
        title: 'Patient Queue',
        icon: TeamOutlined,
        to: '/receptionist/queue',
    },
    {
        title: 'Print Queue Number',
        icon: FileTextOutlined,
        to: '/receptionist/queue/print',
    },
    {
        header: 'Billing',
    },
    {
        title: 'Billing',
        icon: CreditCardOutlined,
        to: '/receptionist/billing',
    },
    {
        header: 'Doctor Schedule',
    },
    {
        title: 'Doctor Schedules',
        icon: ScheduleOutlined,
        to: '/receptionist/doctor-schedules',
    },
]

export default receptionistSidebarItem
