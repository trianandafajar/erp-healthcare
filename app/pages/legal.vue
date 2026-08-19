<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const pageMeta = computed(() => {
    const tab = tabs.find((t) => t.value === activePage.value) ?? tabs[0]
    const meta: Record<string, { subtitle: string; badge: string }> = {
        about: { subtitle: 'Who we are and what we stand for', badge: 'Updated January 2026' },
        privacy: { subtitle: 'How we collect, use, and protect your data', badge: 'Effective 1 Jan 2026 · v2.1' },
        terms: { subtitle: 'The rules that govern platform usage', badge: 'Effective 1 Jan 2026 · v1.4' },
        help: { subtitle: 'Answers to the most common questions', badge: '' },
        contact: { subtitle: "We'd love to hear from you", badge: '' },
    }
    return {
        icon: tab?.icon ?? 'mdi-information-outline',
        title: pageTitles[activePage.value] ?? 'Legal',
        subtitle: meta[activePage.value]?.subtitle ?? '',
        badge: meta[activePage.value]?.badge ?? '',
    }
})

const stats = [
    { label: 'Founded', value: '2026', icon: 'mdi-calendar-star' },
    { label: 'Headquarters', value: 'Semarang', icon: 'mdi-map-marker' },
    { label: 'Industry', value: 'Health Tech', icon: 'mdi-hospital-building' },
    { label: 'Platform', value: 'Healthcare ERP', icon: 'mdi-layers' },
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
    { icon: 'mdi-heart-pulse', title: 'Patient-first', desc: 'Every feature is designed with patient safety and experience at the center.' },
    { icon: 'mdi-shield-check', title: 'Data security', desc: 'Medical data is encrypted, access-controlled, and never shared.' },
    { icon: 'mdi-lightning-bolt', title: 'Efficiency', desc: 'Streamlined workflows so clinicians can focus on care.' },
    { icon: 'mdi-handshake', title: 'Partnership', desc: 'Built together with healthcare professionals on the frontline.' },
]

const privacyTab = ref('collection')

const privacyTabs = [
    { value: 'collection', label: 'Data Collection', icon: 'mdi-database-outline' },
    { value: 'usage', label: 'How We Use Data', icon: 'mdi-cog-outline' },
    { value: 'rights', label: 'Your Rights', icon: 'mdi-account-check-outline' },
    { value: 'security', label: 'Security', icon: 'mdi-shield-lock-outline' },
]

const privacySections: Record<string, { icon: string; title: string; body: string; highlight?: string }[]> = {
    collection: [
        { icon: 'mdi-account-outline', title: 'Account information', body: 'We collect your full name, email, role, and department when you are provisioned as a user. This is used for authentication and permission assignment.' },
        { icon: 'mdi-history', title: 'Usage & audit logs', body: 'System activity including logins, data access, and configuration changes are logged for security monitoring and compliance auditing.' },
        { icon: 'mdi-medical-bag', title: 'Patient & clinical data', body: 'The platform processes patient demographics, medical records, appointments, prescriptions, lab results, and billing. All governed by applicable health data regulations.', highlight: 'We never sell or share patient data with third parties.' },
    ],
    usage: [
        { icon: 'mdi-hospital', title: 'Platform operation', body: 'Data is used exclusively to operate the ERP — powering appointments, clinical documentation, pharmacy, billing, and RBAC.' },
        { icon: 'mdi-chart-bar', title: 'Analytics & improvement', body: 'Anonymized, aggregated usage statistics help us identify bottlenecks and prioritize new features. No individual is identifiable from this data.' },
        { icon: 'mdi-bell-outline', title: 'Notifications', body: 'Your contact info may be used for system alerts and maintenance notices. Marketing is never sent without explicit opt-in.' },
    ],
    rights: [
        { icon: 'mdi-eye-outline', title: 'Right to access', body: 'You may request a copy of your personal data at any time by contacting your system administrator or our support team.' },
        { icon: 'mdi-pencil-outline', title: 'Right to correction', body: 'If any information we hold is inaccurate, you have the right to request a correction. Clinical data corrections must be made by authorized staff.' },
        { icon: 'mdi-delete-outline', title: 'Right to deletion', body: 'You may request deletion of your account data, subject to legal retention requirements. Medical records follow minimum retention periods mandated by Indonesian health law.' },
    ],
    security: [
        { icon: 'mdi-lock-outline', title: 'Encryption', body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Backups are encrypted with the same standard.' },
        { icon: 'mdi-account-key-outline', title: 'Access control', body: 'Granular RBAC ensures each user can only view and modify data permitted by their role and department.' },
        { icon: 'mdi-clipboard-list-outline', title: 'Audit trails', body: 'All sensitive operations are logged with actor ID, timestamp, and action details for full traceability.' },
    ],
}

const openPanel = ref<number | null>(0)

const terms = [
    { title: 'Acceptance of terms', icon: 'mdi-file-sign', body: `By accessing the HealthData ERP Healthcare ERP platform, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.\n\nThese terms apply to all users including administrators, doctors, nurses, pharmacists, and any staff granted access by your organization.` },
    { title: 'Platform access & accounts', icon: 'mdi-account-key', body: `Access is provisioned by your organization's administrator. Each account is personal and non-transferable. You are responsible for maintaining the confidentiality of your credentials.\n\nUsers may only access modules and data within the scope of their assigned role. Attempting to access data outside your permitted scope is a violation of these terms.` },
    { title: 'Acceptable use', icon: 'mdi-check-decagram', body: `You agree to use the platform only for lawful healthcare purposes. You must not:\n\n• Process data unrelated to legitimate healthcare operations\n• Attempt to reverse-engineer or redistribute any part of the platform\n• Introduce malicious code or unauthorized automation\n• Share credentials or use another user's account` },
    { title: 'Data ownership & confidentiality', icon: 'mdi-database-lock', body: `All patient and organizational data remains the property of your organization. HealthData ERP acts as a data processor on your behalf.\n\nYou acknowledge the platform processes sensitive medical information and agree to comply with applicable Indonesian health data regulations.` },
    { title: 'Limitation of liability', icon: 'mdi-shield-alert-outline', body: `The platform is a clinical support tool and does not replace professional medical judgment. HealthData ERP shall not be liable for clinical decisions made based on platform data.\n\nTotal liability for any claim shall not exceed fees paid by your organization in the three months preceding the claim.` },
    { title: 'Changes to these terms', icon: 'mdi-file-edit-outline', body: `We may update these Terms from time to time. We will update the version number and notify administrators via email or in-platform notification.\n\nContinued use of the platform after changes take effect constitutes acceptance of the revised terms.` },
]

const faqCategories = [
    {
        title: 'General',
        icon: 'mdi-help-circle-outline',
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

const filteredFaqs = computed(() => {
    const cat = faqCategories.find(c => c.title === selectedCategory.value)
    return cat?.items ?? []
})

function selectCategory(title: string) {
    selectedCategory.value = title
    openIndex.value = null
}

const contactInfo = [
    { icon: 'mdi-email-outline', label: 'Email', value: 'support@healthdata-erp.com' },
    { icon: 'mdi-phone-outline', label: 'Phone', value: '+62 24 1234 5678' },
    { icon: 'mdi-map-marker-outline', label: 'Address', value: 'Semarang, Indonesia' },
    { icon: 'mdi-clock-outline', label: 'Working Hours', value: 'Mon–Fri, 08:00–17:00' },
]

const contactForm = ref({
    name: '',
    email: '',
    subject: '',
    message: '',
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')

async function handleSubmit() {
    if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) return
    isSubmitting.value = true
    submitError.value = ''
    try {
        await $fetch('/api/contact/send', {
            method: 'POST',
            body: { ...contactForm.value },
        })
        isSubmitted.value = true
        contactForm.value = { name: '', email: '', subject: '', message: '' }
        setTimeout(() => { isSubmitted.value = false }, 4000)
    } catch (e: any) {
        submitError.value = e?.data?.message ?? 'Failed to send your message. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <Header always-shadow />

    <div class="bg-containerBg legal-shell">
        <v-container class="py-8" style="max-width: 1120px">
            <!-- navigation tabs -->
            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface mb-6" style="border-color: #e0e0e0">
                <v-tabs v-model="activePage" color="primary" show-arrows density="default" height="46">
                    <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="text-none mx-1 px-3">
                        <v-icon :icon="tab.icon" size="18" class="mr-2" />
                        <span>{{ tab.label }}</span>
                    </v-tab>
                </v-tabs>
            </v-card>

            <!-- shared page header -->
            <div class="d-flex align-center ga-4 mb-6">
                <v-avatar color="primary" variant="tonal" size="50" rounded="12">
                    <v-icon :icon="pageMeta.icon" color="primary" size="26" />
                </v-avatar>
                <div>
                    <div class="text-h6 text-darkText font-weight-bold">{{ pageMeta.title }}</div>
                    <div class="d-flex flex-wrap align-center ga-2 mt-1">
                        <span class="text-body-2 text-lightText">{{ pageMeta.subtitle }}</span>
                        <v-chip v-if="pageMeta.badge" size="x-small" variant="tonal" color="primary" label>
                            {{ pageMeta.badge }}
                        </v-chip>
                    </div>
                </div>
            </div>

            <!-- About Us -->
            <template v-if="activePage === 'about'">
                <v-row class="mb-6">
                    <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3">
                        <v-card elevation="0" variant="outlined" rounded="md"
                            class="bg-surface pa-4 d-flex align-center ga-3" style="border-color: #e0e0e0">
                            <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
                                <v-icon :icon="stat.icon" color="primary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-caption text-lightText">{{ stat.label }}</div>
                                <div class="text-body-2 font-weight-bold text-darkText">{{ stat.value }}</div>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row class="mb-6">
                    <v-col cols="12" md="7">
                        <v-card class="bg-surface pa-6" elevation="0" variant="outlined" rounded="md"
                            style="border-color: #e0e0e0">
                            <div class="d-flex align-center ga-3 mb-4">
                                <v-avatar color="primary" variant="tonal" size="36" rounded="lg">
                                    <v-icon icon="mdi-bullseye-arrow" color="primary" size="18" />
                                </v-avatar>
                                <div class="text-h6 text-darkText font-weight-bold">Our Mission</div>
                            </div>
                            <p class="text-body-2 text-medium-emphasis mb-0" style="line-height: 1.7">
                                HealthData ERP is dedicated to transforming healthcare operations
                                through intelligent, integrated ERP solutions.
                                We empower hospitals and clinics to deliver better patient outcomes by
                                streamlining clinical, administrative, and
                                financial workflows under one unified platform.
                            </p>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="5">
                        <v-card class="bg-surface pa-6" elevation="0" variant="outlined" rounded="md"
                            style="border-color: #e0e0e0">
                            <div class="d-flex align-center ga-3 mb-4">
                                <v-avatar color="primary" variant="tonal" size="36" rounded="lg">
                                    <v-icon icon="mdi-account-group" color="primary" size="18" />
                                </v-avatar>
                                <div class="text-h6 text-darkText font-weight-bold">Core Team</div>
                            </div>
                            <div class="d-flex flex-column ga-3">
                                <div v-for="member in team" :key="member.name" class="d-flex align-center ga-3">
                                    <v-avatar size="36" class="text-xs font-weight-bold"
                                        :style="{ backgroundColor: member.color, color: member.textColor }">
                                        {{ member.initials }}
                                    </v-avatar>
                                    <div>
                                        <div class="text-body-2 font-weight-medium text-darkText">{{ member.name }}
                                        </div>
                                        <div class="text-caption text-lightText">{{ member.role }}</div>
                                    </div>
                                </div>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col v-for="val in values" :key="val.title" cols="6" md="3">
                        <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface pa-5 text-center"
                            style="border-color: #e0e0e0">
                            <v-avatar color="primary" variant="tonal" size="44" rounded="lg" class="mb-3"
                                style="display: flex; margin-inline: auto">
                                <v-icon :icon="val.icon" color="primary" size="22" />
                            </v-avatar>
                            <div class="text-body-2 font-weight-bold text-darkText mb-1">{{ val.title }}</div>
                            <div class="text-caption text-medium-emphasis" style="line-height: 1.6">{{ val.desc }}</div>
                        </v-card>
                    </v-col>
                </v-row>
            </template>

            <!-- Privacy Policy -->
            <template v-else-if="activePage === 'privacy'">
                <v-row>
                    <v-col cols="12" md="3">
                        <div class="d-none d-md-block">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface pa-4"
                                style="border-color: #e0e0e0">
                                <v-tabs v-model="privacyTab" direction="vertical" color="primary" density="compact">
                                    <v-tab v-for="t in privacyTabs" :key="t.value" :value="t.value"
                                        class="justify-start text-none">
                                        <v-icon :icon="t.icon" size="16" class="ml-3 mr-3" />
                                        <span>{{ t.label }}</span>
                                    </v-tab>
                                </v-tabs>
                            </v-card>
                        </div>

                        <div class="d-md-none">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface mb-1 pa-2"
                                style="border-color: #e0e0e0">
                                <v-tabs v-model="privacyTab" color="primary" density="compact" show-arrows>
                                    <v-tab v-for="t in privacyTabs" :key="t.value" :value="t.value" class="text-none">
                                        <v-icon :icon="t.icon" size="16" class="mr-1" />
                                        <span>{{ t.label }}</span>
                                    </v-tab>
                                </v-tabs>
                            </v-card>
                        </div>
                    </v-col>

                    <v-col cols="12" md="9">
                        <v-row>
                            <v-col v-for="item in privacySections[privacyTab]" :key="item.title" cols="12" sm="6">
                                <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface pa-5"
                                    style="border-color: #e0e0e0">
                                    <div class="d-flex align-center ga-3 mb-3">
                                        <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
                                            <v-icon :icon="item.icon" color="primary" size="20" />
                                        </v-avatar>
                                        <div class="text-subtitle-1 font-weight-semibold text-darkText">{{ item.title }}
                                        </div>
                                    </div>
                                    <p class="text-body-2 text-medium-emphasis mb-0" style="line-height: 1.7">
                                        {{ item.body }}
                                    </p>
                                    <v-alert v-if="item.highlight" color="primary" variant="tonal" density="compact"
                                        rounded="md" class="mt-4">
                                        <div class="d-flex align-start ga-2">
                                            <v-icon icon="mdi-information-outline" size="16" class="mt-0.5" />
                                            <span class="text-body-2">{{ item.highlight }}</span>
                                        </div>
                                    </v-alert>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </template>

            <!-- Terms of Service -->
            <template v-else-if="activePage === 'terms'">
                <v-row>
                    <v-col cols="12" md="3">
                        <div class="d-none d-md-block">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface pa-3"
                                style="border-color: #e0e0e0; position: sticky; top: 88px">
                                <div class="text-caption font-weight-bold text-lightText text-uppercase px-3 pt-2 pb-1">
                                    In this document
                                </div>
                                <v-list density="compact">
                                    <v-list-item v-for="(term, i) in terms" :key="i" :active="openPanel === i"
                                        color="primary" rounded="lg" class="my-0.5"
                                        @click="openPanel = openPanel === i ? null : i">
                                        <template #prepend>
                                            <v-icon :icon="term.icon" size="16" />
                                        </template>
                                        {{ i + 1 }}. {{ term.title }}
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </div>

                        <div class="d-md-none">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface mb-1"
                                style="border-color: #e0e0e0">
                                <v-slide-group show-arrows class="pa-3">
                                    <v-slide-group-item v-for="(term, i) in terms" :key="i">
                                        <v-chip :active="openPanel === i"
                                            :color="openPanel === i ? 'primary' : 'default'" variant="tonal" label
                                            class="ma-1" @click="openPanel = openPanel === i ? null : i">
                                            {{ i + 1 }}. {{ term.title }}
                                        </v-chip>
                                    </v-slide-group-item>
                                </v-slide-group>
                            </v-card>
                        </div>
                    </v-col>

                    <v-col cols="12" md="9">
                        <div class="pa-2">
                            <v-expansion-panels v-model="openPanel" variant="outlined" rounded="md">
                                <v-expansion-panel v-for="(term, i) in terms" :key="i">
                                    <v-expansion-panel-title class="text-body-1 px-4">
                                        <div class="d-flex align-center ga-3">
                                            <v-avatar color="primary" variant="tonal" size="30" rounded="8">
                                                <v-icon :icon="term.icon" color="primary" size="14" />
                                            </v-avatar>
                                            <span class="font-weight-medium text-darkText">{{ i + 1 }}. {{ term.title
                                            }}</span>
                                        </div>
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text class="text-body-2 text-medium-emphasis"
                                        style="white-space: pre-line; line-height: 1.7">
                                        {{ term.body }}
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </div>
                    </v-col>
                </v-row>
            </template>

            <!-- Help Center -->
            <template v-else-if="activePage === 'help'">
                <v-row>
                    <v-col cols="12" md="3">
                        <div class="d-none d-md-block">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface pa-3"
                                style="border-color: #e0e0e0; position: sticky; top: 88px">
                                <v-list density="compact">
                                    <v-list-item v-for="cat in faqCategories" :key="cat.title"
                                        :active="selectedCategory === cat.title" color="primary" rounded="lg"
                                        class="my-0.5" @click="selectCategory(cat.title)">
                                        <template #prepend>
                                            <v-icon :icon="cat.icon" size="16" />
                                        </template>
                                        {{ cat.title }}
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </div>

                        <div class="d-md-none">
                            <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface mb-1"
                                style="border-color: #e0e0e0">
                                <v-slide-group show-arrows class="pa-3">
                                    <v-slide-group-item v-for="cat in faqCategories" :key="cat.title">
                                        <v-chip :active="selectedCategory === cat.title"
                                            :color="selectedCategory === cat.title ? 'primary' : 'default'"
                                            variant="tonal" label class="ma-1" @click="selectCategory(cat.title)">
                                            <v-icon :icon="cat.icon" size="14" class="mr-1" />
                                            {{ cat.title }}
                                        </v-chip>
                                    </v-slide-group-item>
                                </v-slide-group>
                            </v-card>
                        </div>
                    </v-col>

                    <v-col cols="12" md="9">
                        <div class="pa-2">
                            <div v-if="filteredFaqs.length === 0" class="text-center py-12 text-medium-emphasis">
                                There are no questions for this category.
                            </div>
                            <v-expansion-panels v-else v-model="openIndex" variant="outlined" rounded="md">
                                <v-expansion-panel v-for="(item, i) in filteredFaqs" :key="i">
                                    <v-expansion-panel-title class="text-body-1 font-weight-medium text-darkText px-4">
                                        {{ item.question }}
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text class="text-body-2 text-medium-emphasis"
                                        style="line-height: 1.7">
                                        {{ item.answer }}
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </div>
                    </v-col>
                </v-row>
            </template>

            <!-- Contact Us -->
            <template v-else-if="activePage === 'contact'">
                <v-row class="mb-6">
                    <v-col v-for="item in contactInfo" :key="item.label" cols="6" md="3">
                        <v-card elevation="0" variant="outlined" rounded="md"
                            class="bg-surface pa-4 d-flex align-center ga-3" style="border-color: #e0e0e0">
                            <v-avatar color="primary" variant="tonal" size="40" rounded="lg" class="flex-shrink-0">
                                <v-icon :icon="item.icon" color="primary" size="20" />
                            </v-avatar>
                            <div style="min-width: 0">
                                <div class="text-caption text-lightText text-no-wrap text-truncate">{{ item.label }}
                                </div>
                                <div class="text-body-2 font-weight-bold text-darkText text-no-wrap text-truncate"
                                    style="min-width: 0">{{ item.value }}</div>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="12" md="7">
                        <v-card class="bg-surface pa-6" elevation="0" variant="outlined" rounded="md"
                            style="border-color: #e0e0e0">
                            <div class="text-h6 text-darkText font-weight-bold mb-5">Send us a message</div>

                            <v-alert v-if="isSubmitted" type="success" variant="tonal" density="compact" rounded="md"
                                class="mb-6">
                                <div class="text-body-2 font-weight-medium">Message sent successfully!</div>
                                <div class="text-caption">We'll get back to you within 24 hours.</div>
                            </v-alert>

                            <v-alert v-if="submitError" type="error" variant="tonal" density="compact" rounded="md"
                                class="mb-6">
                                <div class="text-body-2">{{ submitError }}</div>
                            </v-alert>

                            <form @submit.prevent="handleSubmit" class="contactForm">
                                <v-row>
                                    <v-col cols="12" sm="6">
                                        <v-label>Full Name</v-label>
                                        <v-text-field v-model="contactForm.name" placeholder="Your name" required
                                            density="comfortable" variant="outlined" hide-details="auto" class="mt-2" />
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-label>Email Address</v-label>
                                        <v-text-field v-model="contactForm.email" type="email"
                                            placeholder="you@example.com" required density="comfortable"
                                            variant="outlined" hide-details="auto" class="mt-2" />
                                    </v-col>
                                    <v-col cols="12">
                                        <v-label>Subject</v-label>
                                        <v-text-field v-model="contactForm.subject" placeholder="How can we help?"
                                            density="comfortable" variant="outlined" hide-details="auto" class="mt-2" />
                                    </v-col>
                                    <v-col cols="12">
                                        <v-label>Message</v-label>
                                        <v-textarea v-model="contactForm.message"
                                            placeholder="Tell us more about your inquiry..." required rows="5"
                                            density="comfortable" variant="outlined" hide-details="auto" class="mt-2" />
                                    </v-col>
                                    <v-col cols="12">
                                        <v-btn color="primary" size="large" block type="submit" :loading="isSubmitting"
                                            :disabled="!contactForm.name || !contactForm.email || !contactForm.message">
                                            <v-icon v-if="!isSubmitting" icon="mdi-send-outline" size="18"
                                                class="mr-2" />
                                            {{ isSubmitting ? 'Sending...' : 'Send Message' }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </form>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="5">
                        <v-card class="bg-surface pa-6" elevation="0" variant="outlined" rounded="md"
                            style="border-color: #e0e0e0">
                            <div class="text-h6 text-darkText font-weight-bold mb-5">Contact Information</div>
                            <div v-for="item in contactInfo" :key="item.label" class="d-flex align-start ga-3 mb-4">
                                <v-avatar color="primary" variant="tonal" size="36" rounded="lg" class="mt-0.5">
                                    <v-icon :icon="item.icon" color="primary" size="18" />
                                </v-avatar>
                                <div>
                                    <div class="text-caption text-lightText">{{ item.label }}</div>
                                    <div class="text-body-2 font-weight-medium text-darkText">{{ item.value }}</div>
                                </div>
                            </div>

                            <v-divider class="my-4" />

                            <div>
                                <div class="text-body-1 font-weight-semibold text-darkText mb-3">Follow Us</div>
                                <div class="d-flex ga-2">
                                    <v-btn icon rounded="circle" color="grey-lighten-3" size="40" min-width="40"
                                        variant="flat" class="text-grey-darken-1">
                                        <v-icon icon="mdi-linkedin" />
                                    </v-btn>
                                    <v-btn icon rounded="circle" color="grey-lighten-3" size="40" min-width="40"
                                        variant="flat" class="text-grey-darken-1">
                                        <v-icon icon="mdi-twitter" />
                                    </v-btn>
                                    <v-btn icon rounded="circle" color="grey-lighten-3" size="40" min-width="40"
                                        variant="flat" class="text-grey-darken-1">
                                        <v-icon icon="mdi-github" />
                                    </v-btn>
                                </div>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </template>
        </v-container>
    </div>

    <Footer />
</template>

<style lang="scss">
.legal-shell {
    min-height: 100vh;
    padding-top: 64px;

    @media (min-width: 768px) {
        padding-top: 72px;
    }
}

.contactForm {
    .v-field__input {
        padding-left: 14px;
    }

    .v-field__outline {
        --v-field-border-width: 1px;
    }
}
</style>
