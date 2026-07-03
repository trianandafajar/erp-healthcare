import {
    AppstoreOutlined,
    HistoryOutlined,
    FileSearchOutlined,
    MedicineBoxOutlined,
    CalendarOutlined,
    ScheduleOutlined,
    FileDoneOutlined,
    CreditCardOutlined,
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

export function patientSidebarItem(slug: string): menu[] {
    const base = `/${slug}/patient`;
    return [
        {
            header: 'Dashboard'
        },
        {
            title: 'Dashboard',
            icon: AppstoreOutlined,
            to: `${base}/dashboard`
        },
        {
            header: 'My Health'
        },
        {
            title: 'Visit History',
            icon: HistoryOutlined,
            to: `${base}/visits`
        },
        {
            title: 'Diagnosis History',
            icon: FileSearchOutlined,
            to: `${base}/diagnoses`
        },
        {
            title: 'Prescription History',
            icon: MedicineBoxOutlined,
            to: `${base}/prescriptions`
        },
        {
            title: 'Examination Results',
            icon: FileDoneOutlined,
            to: `${base}/examination-results`
        },
        {
            header: 'Appointments'
        },
        {
            title: 'Book Appointment',
            icon: CalendarOutlined,
            to: `${base}/book-appointment`
        },
        {
            title: 'Doctor Schedules',
            icon: ScheduleOutlined,
            to: `${base}/doctor-schedules`
        },
        {
            header: 'Billing'
        },
        {
            title: 'Payments',
            icon: CreditCardOutlined,
            to: `${base}/payments`
        },
    ]
}
