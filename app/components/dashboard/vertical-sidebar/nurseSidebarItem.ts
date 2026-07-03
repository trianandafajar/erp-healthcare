import {
    AppstoreOutlined,
    TeamOutlined,
    HeartOutlined,
    FormOutlined,
    CalendarOutlined,
    SolutionOutlined,
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

export function nurseSidebarItem(slug: string): menu[] {
    const base = `/${slug}`
    return [
        {
            header: 'Dashboard',
        },
        {
            title: 'Dashboard',
            icon: AppstoreOutlined,
            to: `${base}/nurse/dashboard`,
        },
        {
            title: 'Monitoring',
            icon: SolutionOutlined,
            to: `${base}/nurse/monitoring`,
        },
        {
            header: 'Nurse Care',
        },
        {
            title: 'Patients',
            icon: TeamOutlined,
            to: `${base}/nurse/patients`,
        },
        {
            title: 'Vital Input',
            icon: HeartOutlined,
            to: `${base}/nurse/vitals`,
        },
        {
            title: 'Care Notes',
            icon: FormOutlined,
            to: `${base}/nurse/care-notes`,
        },
        {
            title: 'Procedure Schedule',
            icon: CalendarOutlined,
            to: `${base}/nurse/procedures`,
        },
    ]
}
