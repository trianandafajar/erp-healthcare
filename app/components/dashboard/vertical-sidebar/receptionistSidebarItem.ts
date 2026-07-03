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

export function receptionistSidebarItem(slug: string): menu[] {
    const base = `/${slug}/receptionist`
    return [
        {
            header: 'Dashboard',
        },
        {
            title: 'Dashboard',
            icon: AppstoreOutlined,
            to: `${base}/dashboard`,
        },
        {
            header: 'Patient Services',
        },
        {
            title: 'Patient Registration',
            icon: UserAddOutlined,
            to: `${base}/patients/register`,
        },
        {
            title: 'Appointment',
            icon: CalendarOutlined,
            to: `${base}/appointments`,
        },
        {
            title: 'Patient Check-in',
            icon: FileDoneOutlined,
            to: `${base}/check-in`,
        },
        {
            header: 'Queue',
        },
        {
            title: 'Patient Queue',
            icon: TeamOutlined,
            to: `${base}/queue`,
        },
        {
            title: 'Print Queue Number',
            icon: FileTextOutlined,
            to: `${base}/queue/print`,
        },
        {
            header: 'Billing',
        },
        {
            title: 'Billing',
            icon: CreditCardOutlined,
            to: `${base}/billing`,
        },
        {
            header: 'Doctor Schedule',
        },
        {
            title: 'Doctor Schedules',
            icon: ScheduleOutlined,
            to: `${base}/doctor-schedules`,
        },
    ]
}
