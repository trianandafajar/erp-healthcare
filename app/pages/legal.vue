<script setup lang="ts">
import Header from '~/components/landingpage/Header.vue'
import Footer from '~/components/landingpage/Footer.vue'

definePageMeta({
    layout: 'blank',
})

const route = useRoute()
const router = useRouter()

const validPages = ['about', 'privacy', 'terms', 'help', 'contact']

const activePage = ref(
    validPages.includes(route.query.page as string)
        ? (route.query.page as string)
        : 'about'
)

watch(activePage, (val) => {
    router.replace({ query: { page: val } })
})

watch(() => route.query.page, (val) => {
    if (val && validPages.includes(val as string)) {
        activePage.value = val as string
    }
})

const pageTitles: Record<string, string> = {
    about: 'About Us',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    help: 'Help Center',
    contact: 'Contact Us',
}

useSeoMeta({
    title: computed(() => pageTitles[activePage.value] ?? 'Legal'),
})

const tabs = [
    { value: 'about', label: 'About Us', icon: 'mdi-information-outline' },
    { value: 'privacy', label: 'Privacy Policy', icon: 'mdi-shield-lock-outline' },
    { value: 'terms', label: 'Terms of Service', icon: 'mdi-file-document-outline' },
    { value: 'help', label: 'Help Center', icon: 'mdi-help-circle-outline' },
    { value: 'contact', label: 'Contact Us', icon: 'mdi-email-outline' },
]

const stats = [
    { label: 'Founded', value: '2026', icon: 'mdi-calendar-star', color: '#176D37' },
    { label: 'Headquarters', value: 'Semarang', icon: 'mdi-map-marker', color: '#176D37' },
    { label: 'Industry', value: 'Health Tech', icon: 'mdi-hospital-building', color: '#176D37' },
    { label: 'Platform', value: 'Healthcare ERP', icon: 'mdi-layers', color: '#176D37' },
]

const team = [
    {
        name: 'Jhon Doe',
        role: 'Lead Engineer & Mentor',
        initials: 'DV',
        color: 'rgba(22, 109, 55, 0.18)',
        textColor: '#176D37',
    },
    {
        name: 'Jhon Doe.',
        role: 'Frontend / Fullstack Developer',
        initials: 'FA',
        color: 'rgba(34, 139, 75, 0.15)',
        textColor: '#1E7A43',
    },
    {
        name: 'Tim Support',
        role: 'Product & Operations',
        initials: 'TS',
        color: 'rgba(67, 160, 71, 0.13)',
        textColor: '#2E7D32',
    },
]

const values = [
    { icon: 'mdi-heart-pulse', color: '#176D37', title: 'Patient-first', desc: 'Every feature is designed with patient safety and experience at the center.' },
    { icon: 'mdi-shield-check', color: '#176D37', title: 'Data security', desc: 'Medical data is encrypted, access-controlled, and never shared.' },
    { icon: 'mdi-lightning-bolt', color: '#176D37', title: 'Efficiency', desc: 'Streamlined workflows so clinicians can focus on care.' },
    { icon: 'mdi-handshake', color: '#176D37', title: 'Partnership', desc: 'Built together with healthcare professionals on the frontline.' },
]

const privacyTab = ref('collection')

const privacyTabs = [
    { value: 'collection', label: 'Data Collection', icon: 'mdi-database-outline' },
    { value: 'usage', label: 'How We Use Data', icon: 'mdi-cog-outline' },
    { value: 'rights', label: 'Your Rights', icon: 'mdi-account-check-outline' },
    { value: 'security', label: 'Security', icon: 'mdi-shield-lock-outline' },
]

const privacySections: Record<string, { icon: string; color: string; title: string; body: string; highlight?: string }[]> = {
    collection: [
        { icon: 'mdi-account-outline', color: '#176D37', title: 'Account information', body: 'We collect your full name, email, role, and department when you are provisioned as a user. This is used for authentication and permission assignment.' },
        { icon: 'mdi-medical-bag', color: '#176D37', title: 'Patient & clinical data', body: 'The platform processes patient demographics, medical records, appointments, prescriptions, lab results, and billing. All governed by applicable health data regulations.', highlight: 'We never sell or share patient data with third parties.' },
        { icon: 'mdi-history', color: '#176D37', title: 'Usage & audit logs', body: 'System activity including logins, data access, and configuration changes are logged for security monitoring and compliance auditing.' },
    ],
    usage: [
        { icon: 'mdi-hospital', color: '#176D37', title: 'Platform operation', body: 'Data is used exclusively to operate the ERP — powering appointments, clinical documentation, pharmacy, billing, and RBAC.' },
        { icon: 'mdi-chart-bar', color: '#176D37', title: 'Analytics & improvement', body: 'Anonymized, aggregated usage statistics help us identify bottlenecks and prioritize new features. No individual is identifiable from this data.' },
        { icon: 'mdi-bell-outline', color: '#176D37', title: 'Notifications', body: 'Your contact info may be used for system alerts and maintenance notices. Marketing is never sent without explicit opt-in.' },
    ],
    rights: [
        { icon: 'mdi-eye-outline', color: '#176D37', title: 'Right to access', body: 'You may request a copy of your personal data at any time by contacting your system administrator or our support team.' },
        { icon: 'mdi-pencil-outline', color: '#176D37', title: 'Right to correction', body: 'If any information we hold is inaccurate, you have the right to request a correction. Clinical data corrections must be made by authorized staff.' },
        { icon: 'mdi-delete-outline', color: '#176D37', title: 'Right to deletion', body: 'You may request deletion of your account data, subject to legal retention requirements. Medical records follow minimum retention periods mandated by Indonesian health law.' },
    ],
    security: [
        { icon: 'mdi-lock-outline', color: '#176D37', title: 'Encryption', body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Backups are encrypted with the same standard.' },
        { icon: 'mdi-account-key-outline', color: '#176D37', title: 'Access control', body: 'Granular RBAC ensures each user can only view and modify data permitted by their role and department.' },
        { icon: 'mdi-clipboard-list-outline', color: '#176D37', title: 'Audit trails', body: 'All sensitive operations are logged with actor ID, timestamp, and action details for full traceability.' },
    ],
}

const openPanel = ref<number | null>(0)

function togglePanel(index: number) {
    openPanel.value = openPanel.value === index ? null : index
}

const terms = [
    { title: 'Acceptance of terms', icon: 'mdi-file-sign', color: '#176D37', body: `By accessing the HealthData ERP Healthcare ERP platform, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.\n\nThese terms apply to all users including administrators, doctors, nurses, pharmacists, and any staff granted access by your organization.` },
    { title: 'Platform access & accounts', icon: 'mdi-account-key', color: '#176D37', body: `Access is provisioned by your organization's administrator. Each account is personal and non-transferable. You are responsible for maintaining the confidentiality of your credentials.\n\nUsers may only access modules and data within the scope of their assigned role. Attempting to access data outside your permitted scope is a violation of these terms.` },
    { title: 'Acceptable use', icon: 'mdi-check-decagram', color: '#176D37', body: `You agree to use the platform only for lawful healthcare purposes. You must not:\n\n• Process data unrelated to legitimate healthcare operations\n• Attempt to reverse-engineer or redistribute any part of the platform\n• Introduce malicious code or unauthorized automation\n• Share credentials or use another user's account` },
    { title: 'Data ownership & confidentiality', icon: 'mdi-database-lock', color: '#176D37', body: `All patient and organizational data remains the property of your organization. HealthData ERP acts as a data processor on your behalf.\n\nYou acknowledge the platform processes sensitive medical information and agree to comply with applicable Indonesian health data regulations.` },
    { title: 'Limitation of liability', icon: 'mdi-shield-alert-outline', color: '#176D37', body: `The platform is a clinical support tool and does not replace professional medical judgment. HealthData ERP shall not be liable for clinical decisions made based on platform data.\n\nTotal liability for any claim shall not exceed fees paid by your organization in the three months preceding the claim.` },
    { title: 'Changes to these terms', icon: 'mdi-file-edit-outline', color: '#176D37', body: `We may update these Terms from time to time. We will update the version number and notify administrators via email or in-platform notification.\n\nContinued use of the platform after changes take effect constitutes acceptance of the revised terms.` },
]

const faqCategories = [
    {
        title: 'General',
        icon: 'mdi-help-circle-outline',
        color: '#176D37',
        items: [
            {
                question: 'What is HealthData ERP Healthcare ERP?',
                answer: 'HealthData ERP Healthcare ERP is an integrated healthcare management platform that helps hospitals and clinics manage patients, appointments, medical records, pharmacy, billing, and administrative operations in one secure system.',
            },
            {
                question: 'Who can use this platform?',
                answer: 'The platform is designed for healthcare organizations, including administrators, doctors, nurses, pharmacists, laboratory staff, finance teams, and other authorized personnel.',
            },
        ],
    },
    {
        title: 'Account & Login',
        icon: 'mdi-account-circle-outline',
        color: '#176D37',
        items: [
            {
                question: 'I forgot my password. What should I do?',
                answer: 'Please contact your organization administrator or use the password reset feature if it has been enabled for your account.',
            },
            {
                question: 'Why can\u2019t I access certain modules?',
                answer: 'Access is controlled using Role-Based Access Control (RBAC). If you believe you should have access, contact your administrator.',
            },
        ],
    },
    {
        title: 'Appointments',
        icon: 'mdi-calendar-check-outline',
        color: '#176D37',
        items: [
            {
                question: 'How do I create a new appointment?',
                answer: 'Navigate to the Appointments module, click "New Appointment", select a patient, doctor, date, and time, then save the appointment.',
            },
            {
                question: 'Can appointments be rescheduled?',
                answer: 'Yes. Authorized users can edit an appointment and choose a new available date and time.',
            },
        ],
    },
    {
        title: 'Security & Privacy',
        icon: 'mdi-shield-lock-outline',
        color: '#176D37',
        items: [
            {
                question: 'Is patient data secure?',
                answer: 'Yes. Patient information is protected using encryption, role-based permissions, and audit logging to ensure confidentiality and compliance.',
            },
            {
                question: 'Are user activities recorded?',
                answer: 'Yes. Important actions such as login, data updates, and administrative changes are stored in audit logs.',
            },
        ],
    },
]

const selectedCategory = ref(faqCategories[0]?.title ?? '')
const openIndex = ref<number | null>(null)

const contactInfo = [
    { icon: 'mdi-email-outline', label: 'Email', value: 'support@healthdata-erp.com', color: '#176D37' },
    { icon: 'mdi-phone-outline', label: 'Phone', value: '+62 24 1234 5678', color: '#176D37' },
    { icon: 'mdi-map-marker-outline', label: 'Address', value: 'Semarang, Indonesia', color: '#176D37' },
    { icon: 'mdi-clock-outline', label: 'Working Hours', value: 'Mon–Fri, 08:00–17:00', color: '#176D37' },
]

const contactForm = ref({
    name: '',
    email: '',
    subject: '',
    message: '',
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)

async function handleSubmit() {
    if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) return
    isSubmitting.value = true
    try {
        await $fetch('/api/contact/send', {
            method: 'POST',
            body: { ...contactForm.value },
        })
        isSubmitted.value = true
        contactForm.value = { name: '', email: '', subject: '', message: '' }
        setTimeout(() => { isSubmitted.value = false }, 4000)
    } catch {
    } finally {
        isSubmitting.value = false
    }
}

const filteredFaqs = computed(() => {
    const cat = faqCategories.find(c => c.title === selectedCategory.value)
    return cat?.items ?? []
})

function toggleItem(index: number) {
    openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
    <Header always-shadow />

    <div class="min-h-screen bg-gray-50 pt-16 md:pt-[72px]">
        <div class="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <!-- navigation -->
            <div class="flex flex-wrap gap-2 mb-8 md:mb-10">
                <button v-for="tab in tabs" :key="tab.value"
                    class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full border-2 transition-all duration-200 cursor-pointer"
                    :class="activePage === tab.value
                        ? 'border-[#176D37] bg-[#176D37]/10 text-[#176D37]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800'"
                    @click="activePage = tab.value">
                    <v-icon :icon="tab.icon" size="18" />
                    {{ tab.label }}
                </button>
            </div>

            <template v-if="activePage === 'about'">
                <div class="mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">About Us</h1>
                    <p class="mt-2 text-gray-500">Last updated &middot; January 2026</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div v-for="stat in stats" :key="stat.label"
                        class="flex items-center gap-3 p-6 bg-white border border-gray-200 rounded-md">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            :style="{ backgroundColor: stat.color + '1a' }">
                            <v-icon :icon="stat.icon" size="20" :color="stat.color" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">{{ stat.label }}</div>
                            <div class="text-sm font-bold text-gray-900">{{ stat.value }}</div>
                        </div>
                    </div>
                </div>

                <div class="grid md:grid-cols-12 gap-6 mb-8">
                    <div class="md:col-span-7 bg-white border border-gray-200 rounded-md p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-9 h-9 rounded-full flex items-center justify-center bg-[#176D37]/10">
                                <v-icon icon="mdi-bullseye-arrow" size="18" color="#176D37" />
                            </div>
                            <h2 class="text-lg font-semibold text-gray-900">Our Mission</h2>
                        </div>
                        <p class="text-sm text-gray-600 leading-relaxed">
                            HealthData ERP is dedicated to transforming healthcare operations
                            through intelligent, integrated ERP solutions.
                            We empower hospitals and clinics to deliver better patient outcomes by
                            streamlining clinical, administrative, and
                            financial workflows under one unified platform.
                        </p>
                    </div>

                    <div class="md:col-span-5 bg-white border border-gray-200 rounded-md p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-9 h-9 rounded-full flex items-center justify-center bg-[#176D37]/10">
                                <v-icon icon="mdi-account-group" size="18" color="#176D37" />
                            </div>
                            <h2 class="text-lg font-semibold text-gray-900">Core Team</h2>
                        </div>
                        <div class="space-y-3">
                            <div v-for="member in team" :key="member.name" class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    :style="{
                                        backgroundColor: member.color,
                                        color: member.textColor
                                    }">
                                    {{ member.initials }}
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-gray-900">{{ member.name }}</div>
                                    <div class="text-xs text-gray-500">{{ member.role }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div v-for="val in values" :key="val.title"
                        class="text-center p-6 bg-white border border-gray-200 rounded-md">
                        <div class="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                            :style="{ backgroundColor: val.color + '1a' }">
                            <v-icon :icon="val.icon" size="22" :color="val.color" />
                        </div>
                        <div class="text-sm font-bold text-gray-900 mb-1">{{ val.title }}</div>
                        <div class="text-xs text-gray-500 leading-relaxed">{{ val.desc }}</div>
                    </div>
                </div>
            </template>

            <!-- Privacy Policy -->
            <template v-else-if="activePage === 'privacy'">
                <div class="mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
                    <p class="mt-2 text-gray-500">Effective date &middot; 1 January 2026 &middot; Version 2.1</p>
                </div>

                <div class="grid md:grid-cols-4 gap-6">
                    <div class="bg-white border border-gray-200 rounded-md p-6">
                        <div class="space-y-2">
                            <button v-for="tab in privacyTabs" :key="tab.value" @click="privacyTab = tab.value"
                                class="relative flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-300"
                                :class="privacyTab === tab.value
                                    ? 'bg-[#176D37]/10 text-[#176D37] font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'">
                                <span
                                    class="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-[#176D37] transition-all duration-300"
                                    :class="privacyTab === tab.value ? 'opacity-100' : 'opacity-0'" />

                                <v-icon :icon="tab.icon" size="20" />
                                <span>{{ tab.label }}</span>
                            </button>
                        </div>
                    </div>
                    <div class="md:col-span-3">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div v-for="item in privacySections[privacyTab]" :key="item.title"
                                class="bg-white rounded-md p-5 border border-gray-200">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center"
                                        :style="{ backgroundColor: item.color + '1a' }">
                                        <v-icon :icon="item.icon" :color="item.color" size="20" />
                                    </div>

                                    <h3 class="font-semibold text-gray-900">
                                        {{ item.title }}
                                    </h3>
                                </div>

                                <p class="text-sm text-gray-600 leading-relaxed">
                                    {{ item.body }}
                                </p>

                                <div v-if="item.highlight"
                                    class="mt-4 p-3 rounded-lg bg-[#176D37]/5 border border-[#176D37]/15 flex gap-2">
                                    <v-icon icon="mdi-information-outline" size="18" color="#176D37" />

                                    <p class="text-xs text-[#176D37]">
                                        {{ item.highlight }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </template>

            <!-- Terms of Service -->
            <template v-else-if="activePage === 'terms'">
                <div class="mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
                        Terms of Service
                    </h1>
                    <p class="mt-2 text-gray-500">
                        Effective date &middot; 1 January 2026 &middot; Version 1.4
                    </p>
                </div>

                <div class="grid md:grid-cols-4 gap-6">
                    <div class="md:col-span-1">
                        <div class="bg-white border border-gray-200 rounded-md p-4 sticky top-24">
                            <div class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                                In this document
                            </div>

                            <div class="space-y-1">
                                <button v-for="(term, i) in terms" :key="i" @click="togglePanel(i)"
                                    class="relative flex items-center gap-2 w-full px-4 py-3 rounded-lg text-left transition-all duration-300"
                                    :class="openPanel === i
                                        ? 'bg-[#176D37]/10 text-[#176D37] font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'">
                                    <span
                                        class="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-[#176D37] transition-all duration-300"
                                        :class="openPanel === i ? 'opacity-100' : 'opacity-0'" />

                                    <v-icon :icon="term.icon" size="16" />

                                    {{ i + 1 }}. {{ term.title }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="md:col-span-3 space-y-3">
                        <div v-for="(term, i) in terms" :key="i"
                            class="bg-white border border-gray-200 rounded-md overflow-hidden">
                            <button @click="togglePanel(i)"
                                class="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                        :style="{ backgroundColor: term.color + '1a' }">
                                        <v-icon :icon="term.icon" size="16" :color="term.color" />
                                    </div>

                                    <span class="text-sm font-medium text-gray-900">
                                        {{ i + 1 }}. {{ term.title }}
                                    </span>
                                </div>

                                <v-icon :icon="openPanel === i ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20"
                                    class="text-gray-400 transition-transform duration-300"
                                    :class="{ 'rotate-180': openPanel === i }" />
                            </button>

                            <Transition enter-active-class="transition-all duration-300"
                                leave-active-class="transition-all duration-300">
                                <div v-show="openPanel === i" class="px-5 pb-5">
                                    <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {{ term.body }}
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            </template>

            <template v-else-if="activePage === 'help'">
                <div class="mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
                        Frequently Asked Questions
                    </h1>
                    <p class="mt-2 text-gray-500">
                        Find answers to common questions about the platform
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white border border-gray-200 rounded-md p-6">
                        <div class="space-y-2">
                            <button v-for="cat in faqCategories" :key="cat.title"
                                @click="selectedCategory = cat.title; openIndex = null"
                                class="relative flex items-center w-full px-4 py-3 rounded-lg text-left transition-all duration-300"
                                :class="selectedCategory === cat.title
                                    ? 'bg-[#176D37]/10 text-[#176D37] font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'">
                                <span
                                    class="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-[#176D37] transition-all duration-300"
                                    :class="selectedCategory === cat.title ? 'opacity-100' : 'opacity-0'" />

                                {{ cat.title }}
                            </button>
                        </div>
                    </div>
                    <div class="md:col-span-3 space-y-3">
                        <div v-if="filteredFaqs.length === 0" class="text-center py-12 text-gray-400">
                            There are no questions for this category.
                        </div>

                        <div v-for="(item, i) in filteredFaqs" :key="i"
                            class="bg-white border border-gray-200 rounded-md overflow-hidden">
                            <button @click="toggleItem(i)"
                                class="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                                <span class="text-sm font-medium text-gray-900">
                                    {{ item.question }}
                                </span>

                                <v-icon :icon="openIndex === i ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20"
                                    class="text-gray-400 transition-transform duration-300"
                                    :class="{ 'rotate-180': openIndex === i }" />
                            </button>

                            <Transition enter-active-class="transition-all duration-300"
                                leave-active-class="transition-all duration-300">
                                <div v-show="openIndex === i" class="px-5 pb-5">
                                    <p class="text-sm text-gray-600 leading-relaxed">
                                        {{ item.answer }}
                                    </p>
                                </div>
                            </Transition>
                        </div>
                    </div>

                </div>
            </template>

            <template v-else-if="activePage === 'contact'">
                <div class="mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">Contact Us</h1>
                    <p class="mt-2 text-gray-500">We'd love to hear from you. Get in touch with our team.</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div v-for="item in contactInfo" :key="item.label"
                        class="flex items-center gap-3 p-6 bg-white border border-gray-200 rounded-md">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            :style="{ backgroundColor: item.color + '1a' }">
                            <v-icon :icon="item.icon" size="20" :color="item.color" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">{{ item.label }}</div>
                            <div class="text-sm font-bold text-gray-900">{{ item.value }}</div>
                        </div>
                    </div>
                </div>

                <div class="grid md:grid-cols-5 gap-6">
                    <div class="md:col-span-3 bg-white border border-gray-200 rounded-md p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-5">Send us a message</h2>

                        <div v-if="isSubmitted"
                            class="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                            <v-icon icon="mdi-check-circle" size="22" color="#16a34a" />
                            <div>
                                <p class="text-sm font-medium text-green-800">Message sent successfully!</p>
                                <p class="text-xs text-green-600 mt-0.5">We'll get back to you within 24 hours.</p>
                            </div>
                        </div>

                        <form @submit.prevent="handleSubmit" class="contactForm space-y-5">
                            <div class="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <v-label>Full Name</v-label>
                                    <v-text-field v-model="contactForm.name" placeholder="Your name" required
                                        hide-details="auto" variant="outlined" color="primary" class="mt-2">
                                    </v-text-field>
                                </div>
                                <div>
                                    <v-label>Email Address</v-label>
                                    <v-text-field v-model="contactForm.email" type="email" placeholder="you@example.com"
                                        required hide-details="auto" variant="outlined" color="primary" class="mt-2">
                                    </v-text-field>
                                </div>
                            </div>

                            <div>
                                <v-label>Subject</v-label>
                                <v-text-field v-model="contactForm.subject" placeholder="How can we help?"
                                    hide-details="auto" variant="outlined" color="primary" class="mt-2">
                                </v-text-field>
                            </div>

                            <div>
                                <v-label>Message</v-label>
                                <v-textarea v-model="contactForm.message"
                                    placeholder="Tell us more about your inquiry..." required rows="5"
                                    hide-details="auto" variant="outlined" color="primary" class="mt-2">
                                </v-textarea>
                            </div>

                            <v-btn color="primary" :loading="isSubmitting" block class="mt-2" variant="flat"
                                size="large" :disabled="!contactForm.name || !contactForm.email || !contactForm.message"
                                type="submit">
                                <v-icon v-if="!isSubmitting" icon="mdi-send-outline" size="18" class="mr-2" />
                                {{ isSubmitting ? 'Sending...' : 'Send Message' }}
                            </v-btn>
                        </form>
                    </div>

                    <div class="md:col-span-2 bg-white border border-gray-200 rounded-md p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-5">Contact Information</h2>
                        <div class="space-y-5">
                            <div v-for="item in contactInfo" :key="item.label" class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                    :style="{ backgroundColor: item.color + '1a' }">
                                    <v-icon :icon="item.icon" size="18" :color="item.color" />
                                </div>
                                <div>
                                    <div class="text-xs text-gray-500">{{ item.label }}</div>
                                    <div class="text-sm font-medium text-gray-900">{{ item.value }}</div>
                                </div>
                            </div>
                        </div>

                        <hr class="my-5 border-gray-200" />

                        <div>
                            <h3 class="text-sm font-semibold text-gray-900 mb-3">Follow Us</h3>
                            <div class="flex gap-3">
                                <a href="#"
                                    class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-[#176D37]/10 text-gray-500 hover:text-[#176D37] transition-all duration-200">
                                    <v-icon icon="mdi-linkedin" size="18" />
                                </a>
                                <a href="#"
                                    class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-[#176D37]/10 text-gray-500 hover:text-[#176D37] transition-all duration-200">
                                    <v-icon icon="mdi-twitter" size="18" />
                                </a>
                                <a href="#"
                                    class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-[#176D37]/10 text-gray-500 hover:text-[#176D37] transition-all duration-200">
                                    <v-icon icon="mdi-github" size="18" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>

    <Footer />
</template>

<style lang="scss">
.contactForm {
    .v-field__input {
        padding-left: 14px;
    }

    .v-field__outline {
        --v-field-border-width: 1px;
    }
}
</style>