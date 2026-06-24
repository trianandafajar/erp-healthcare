import {
    AppstoreOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    MedicineBoxOutlined,
    InboxOutlined,
    DownloadOutlined,
    UploadOutlined,
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

const pharmacySidebarItem: menu[] = [
    { header: 'Dashboard' },
    { title: 'Dashboard', icon: AppstoreOutlined, to: '/pharmacy/dashboard' },

    { header: 'Operations' },
    { title: 'Incoming Prescriptions', icon: FileTextOutlined, to: '/pharmacy/prescriptions' },
    { title: 'Verification', icon: CheckCircleOutlined, to: '/pharmacy/verification' },
    { title: 'Dispensing', icon: MedicineBoxOutlined, to: '/pharmacy/dispensing' },

    { header: 'Inventory' },
    { title: 'Stock', icon: InboxOutlined, to: '/pharmacy/stock' },
    { title: 'Incoming Stock', icon: DownloadOutlined, to: '/pharmacy/stock-in' },
    { title: 'Outgoing Stock', icon: UploadOutlined, to: '/pharmacy/stock-out' },
]

export default pharmacySidebarItem