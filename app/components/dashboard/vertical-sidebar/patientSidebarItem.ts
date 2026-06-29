import {
    AppstoreOutlined,
    UserOutlined,
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

const patientSidebarItem: menu[] = [
    {
        header: 'Dashboard'
    },
    {
        title: 'Dashboard',
        icon: AppstoreOutlined,
        to: '/patient/dashboard'
    },
    {
        header: 'My Health'
    },
    {
        title: 'Visit History',
        icon: HistoryOutlined,
        to: '/patient/visits'
    },
    {
        title: 'Diagnosis History',
        icon: FileSearchOutlined,
        to: '/patient/diagnoses'
    },
    {
        title: 'Prescription History',
        icon: MedicineBoxOutlined,
        to: '/patient/prescriptions'
    },
    {
        title: 'Examination Results',
        icon: FileDoneOutlined,
        to: '/patient/examination-results'
    },
    {
        header: 'Appointments'
    },
    {
        title: 'Book Appointment',
        icon: CalendarOutlined,
        to: '/patient/book-appointment'
    },
    {
        title: 'Doctor Schedules',
        icon: ScheduleOutlined,
        to: '/patient/doctor-schedules'
    },
    {
        header: 'Billing'
    },
    {
        title: 'Payments',
        icon: CreditCardOutlined,
        to: '/patient/payments'
    },
];

export default patientSidebarItem;
