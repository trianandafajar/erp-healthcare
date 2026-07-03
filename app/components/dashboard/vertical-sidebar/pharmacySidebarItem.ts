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

export function pharmacySidebarItem(slug: string): menu[] {
    const base = `/${slug}/pharmacy`
    return [
        { header: 'Dashboard' },
        { title: 'Dashboard', icon: AppstoreOutlined, to: `${base}/dashboard` },

        { header: 'Operations' },
        { title: 'Incoming Prescriptions', icon: FileTextOutlined, to: `${base}/prescriptions` },
        { title: 'Verification', icon: CheckCircleOutlined, to: `${base}/verification` },
        { title: 'Dispensing', icon: MedicineBoxOutlined, to: `${base}/dispensing` },

        { header: 'Inventory' },
        { title: 'Stock', icon: InboxOutlined, to: `${base}/stock` },
        { title: 'Incoming Stock', icon: DownloadOutlined, to: `${base}/stock-in` },
        { title: 'Outgoing Stock', icon: UploadOutlined, to: `${base}/stock-out` },
    ]
}