export interface menu {
    header?: string
    title?: string
    icon?: string
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
    {
        header: 'Dashboard',
    },
    {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard-outline',
        to: '/pharmacy/dashboard',
    },
    {
        header: 'Operations',
    },
    {
        title: 'Incoming Prescriptions',
        icon: 'mdi-file-document-outline',
        to: '/pharmacy/prescriptions',
    },
    {
        title: 'Verification',
        icon: 'mdi-clipboard-check-outline',
        to: '/pharmacy/verification',
    },
    {
        title: 'Dispensing',
        icon: 'mdi-pill',
        to: '/pharmacy/dispensing',
    },
    {
        header: 'Inventory',
    },
    {
        title: 'Stock',
        icon: 'mdi-archive-outline',
        to: '/pharmacy/stock',
    },
    {
        title: 'Incoming Stock',
        icon: 'mdi-tray-arrow-down',
        to: '/pharmacy/stock-in',
    },
    {
        title: 'Outgoing Stock',
        icon: 'mdi-tray-arrow-up',
        to: '/pharmacy/stock-out',
    },
]

export default pharmacySidebarItem
