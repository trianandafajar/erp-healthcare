<script setup lang="ts">
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

const navItems = [
    {
        section: 'Company',
        items: [
            { value: 'about', label: 'About Us', icon: 'mdi-information-outline' },
        ]
    },
    {
        section: 'Legal',
        items: [
            { value: 'privacy', label: 'Privacy Policy', icon: 'mdi-shield-lock-outline' },
            { value: 'terms', label: 'Terms of Service', icon: 'mdi-file-document-outline' },
        ]
    },
    {
        section: 'Support',
        items: [
            { value: 'help', label: 'Help Center', icon: 'mdi-help-circle-outline' },
            { value: 'contact', label: 'Contact Us', icon: 'mdi-email-outline' },
        ]
    },
]

const stats = [
    { label: 'Founded', value: '2026', icon: 'mdi-calendar-star', color: 'primary' },
    { label: 'Headquarters', value: 'Semarang', icon: 'mdi-map-marker', color: 'error' },
    { label: 'Industry', value: 'Health Tech', icon: 'mdi-hospital-building', color: 'success' },
    { label: 'Platform', value: 'Healthcare ERP', icon: 'mdi-layers', color: 'info' },
]

const team = [
    { name: 'Jhon Doe', role: 'Lead Engineer & Mentor', initials: 'DV', color: 'primary' },
    { name: 'Jhon Doe.', role: 'Frontend / Fullstack Developer', initials: 'FA', color: 'success' },
    { name: 'Tim Support', role: 'Product & Operations', initials: 'TS', color: 'warning' },
]

const values = [
    { icon: 'mdi-heart-pulse', color: 'error', title: 'Patient-first', desc: 'Every feature is designed with patient safety and experience at the center.' },
    { icon: 'mdi-shield-check', color: 'success', title: 'Data security', desc: 'Medical data is encrypted, access-controlled, and never shared.' },
    { icon: 'mdi-lightning-bolt', color: 'warning', title: 'Efficiency', desc: 'Streamlined workflows so clinicians can focus on care.' },
    { icon: 'mdi-handshake', color: 'info', title: 'Partnership', desc: 'Built together with healthcare professionals on the frontline.' },
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
        { icon: 'mdi-account-outline', color: 'primary', title: 'Account information', body: 'We collect your full name, email, role, and department when you are provisioned as a user. This is used for authentication and permission assignment.' },
        { icon: 'mdi-medical-bag', color: 'error', title: 'Patient & clinical data', body: 'The platform processes patient demographics, medical records, appointments, prescriptions, lab results, and billing. All governed by applicable health data regulations.', highlight: 'We never sell or share patient data with third parties.' },
        { icon: 'mdi-history', color: 'info', title: 'Usage & audit logs', body: 'System activity including logins, data access, and configuration changes are logged for security monitoring and compliance auditing.' },
    ],
    usage: [
        { icon: 'mdi-hospital', color: 'success', title: 'Platform operation', body: 'Data is used exclusively to operate the ERP — powering appointments, clinical documentation, pharmacy, billing, and RBAC.' },
        { icon: 'mdi-chart-bar', color: 'warning', title: 'Analytics & improvement', body: 'Anonymized, aggregated usage statistics help us identify bottlenecks and prioritize new features. No individual is identifiable from this data.' },
        { icon: 'mdi-bell-outline', color: 'info', title: 'Notifications', body: 'Your contact info may be used for system alerts and maintenance notices. Marketing is never sent without explicit opt-in.' },
    ],
    rights: [
        { icon: 'mdi-eye-outline', color: 'primary', title: 'Right to access', body: 'You may request a copy of your personal data at any time by contacting your system administrator or our support team.' },
        { icon: 'mdi-pencil-outline', color: 'success', title: 'Right to correction', body: 'If any information we hold is inaccurate, you have the right to request a correction. Clinical data corrections must be made by authorized staff.' },
        { icon: 'mdi-delete-outline', color: 'error', title: 'Right to deletion', body: 'You may request deletion of your account data, subject to legal retention requirements. Medical records follow minimum retention periods mandated by Indonesian health law.' },
    ],
    security: [
        { icon: 'mdi-lock-outline', color: 'primary', title: 'Encryption', body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Backups are encrypted with the same standard.' },
        { icon: 'mdi-account-key-outline', color: 'success', title: 'Access control', body: 'Granular RBAC ensures each user can only view and modify data permitted by their role and department.' },
        { icon: 'mdi-clipboard-list-outline', color: 'warning', title: 'Audit trails', body: 'All sensitive operations are logged with actor ID, timestamp, and action details for full traceability.' },
    ],
}

const openPanels = ref<number[]>([0])

const terms = [
    { title: 'Acceptance of terms', icon: 'mdi-file-sign', color: 'primary', body: `By accessing the HealthData ERP Healthcare ERP platform, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.\n\nThese terms apply to all users including administrators, doctors, nurses, pharmacists, and any staff granted access by your organization.` },
    { title: 'Platform access & accounts', icon: 'mdi-account-key', color: 'info', body: `Access is provisioned by your organization's administrator. Each account is personal and non-transferable. You are responsible for maintaining the confidentiality of your credentials.\n\nUsers may only access modules and data within the scope of their assigned role. Attempting to access data outside your permitted scope is a violation of these terms.` },
    { title: 'Acceptable use', icon: 'mdi-check-decagram', color: 'success', body: `You agree to use the platform only for lawful healthcare purposes. You must not:\n\n• Process data unrelated to legitimate healthcare operations\n• Attempt to reverse-engineer or redistribute any part of the platform\n• Introduce malicious code or unauthorized automation\n• Share credentials or use another user's account` },
    { title: 'Data ownership & confidentiality', icon: 'mdi-database-lock', color: 'warning', body: `All patient and organizational data remains the property of your organization. HealthData ERP acts as a data processor on your behalf.\n\nYou acknowledge the platform processes sensitive medical information and agree to comply with applicable Indonesian health data regulations.` },
    { title: 'Limitation of liability', icon: 'mdi-shield-alert-outline', color: 'error', body: `The platform is a clinical support tool and does not replace professional medical judgment. HealthData ERP shall not be liable for clinical decisions made based on platform data.\n\nTotal liability for any claim shall not exceed fees paid by your organization in the three months preceding the claim.` },
    { title: 'Changes to these terms', icon: 'mdi-file-edit-outline', color: 'secondary', body: `We may update these Terms from time to time. We will update the version number and notify administrators via email or in-platform notification.\n\nContinued use of the platform after changes take effect constitutes acceptance of the revised terms.` },
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
                question: 'Why can’t I access certain modules?',
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

const faqPanel = ref<number[]>([0])
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-text class="pa-0">
                    <div class="d-flex" style="min-height: 100vh">

                        <!-- Sidebar -->
                        <div style="width: 220px; flex-shrink: 0;">
                            <div class="pa-4">
                                <!-- Back button -->
                                <v-btn variant="text" prepend-icon="mdi-arrow-left" size="small" class="mb-4"
                                    @click="router.back()">
                                    Back
                                </v-btn>

                                <v-divider class="mb-4" />

                                <div v-for="group in navItems" :key="group.section" class="mb-4">
                                    <div
                                        class="text-caption text-medium-emphasis text-uppercase font-weight-bold px-2 mb-1">
                                        {{ group.section }}
                                    </div>

                                    <v-list density="compact" nav class="pa-0">
                                        <v-list-item v-for="item in group.items" :key="item.value"
                                            :prepend-icon="item.icon" :title="item.label" :value="item.value"
                                            :active="activePage === item.value" active-color="primary" rounded="lg"
                                            @click="activePage = item.value" />
                                    </v-list>
                                </div>
                            </div>
                        </div>

                        <v-divider vertical />

                        <div class="flex-grow-1 pa-6" style="min-width: 0;">
                            <template v-if="activePage === 'about'">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar size="48" color="primary">
                                        <v-icon icon="mdi-information-outline" size="26" />
                                    </v-avatar>
                                    <div>
                                        <div class="text-h5 font-weight-bold">About Us</div>
                                        <div class="text-caption text-medium-emphasis">Last updated · January 2026</div>
                                    </div>
                                </div>

                                <v-divider class="mb-6" />

                                <v-row class="mb-4">
                                    <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3">
                                        <v-card elevation="1">
                                            <v-card-text class="d-flex align-center ga-3 pa-3">
                                                <v-avatar :color="stat.color" size="36">
                                                    <v-icon :icon="stat.icon" size="18" />
                                                </v-avatar>
                                                <div>
                                                    <div class="text-caption text-medium-emphasis">{{ stat.label }}
                                                    </div>
                                                    <div class="text-body-2 font-weight-bold">{{ stat.value }}</div>
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>

                                <v-row class="mb-4">
                                    <v-col cols="12" md="7">
                                        <v-card elevation="1" height="100%">
                                            <v-card-item>
                                                <template #prepend>
                                                    <v-avatar color="primary" size="34">
                                                        <v-icon icon="mdi-bullseye-arrow" size="18" />
                                                    </v-avatar>
                                                </template>
                                                <v-card-title class="text-body-1">Our Mission</v-card-title>
                                            </v-card-item>
                                            <v-divider />
                                            <v-card-text class="text-body-2 text-medium-emphasis"
                                                style="line-height:1.8">
                                                HealthData ERP is dedicated to transforming healthcare operations
                                                through intelligent, integrated ERP solutions.
                                                We empower hospitals and clinics to deliver better patient outcomes by
                                                streamlining clinical, administrative, and
                                                financial workflows under one unified platform.
                                            </v-card-text>
                                        </v-card>
                                    </v-col>

                                    <v-col cols="12" md="5">
                                        <v-card elevation="1" height="100%">
                                            <v-card-item>
                                                <template #prepend>
                                                    <v-avatar color="secondary" size="34">
                                                        <v-icon icon="mdi-account-group" size="18" />
                                                    </v-avatar>
                                                </template>
                                                <v-card-title class="text-body-1">Core Team</v-card-title>
                                            </v-card-item>
                                            <v-divider />
                                            <v-list density="compact">
                                                <v-list-item v-for="member in team" :key="member.name"
                                                    :title="member.name" :subtitle="member.role">
                                                    <template #prepend>
                                                        <v-avatar :color="member.color" size="34">
                                                            <span class="text-caption font-weight-bold">{{
                                                                member.initials }}</span>
                                                        </v-avatar>
                                                    </template>
                                                </v-list-item>
                                            </v-list>
                                        </v-card>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col v-for="val in values" :key="val.title" cols="6" md="3">
                                        <v-card elevation="1" height="100%">
                                            <v-card-text class="text-center pa-4">
                                                <v-avatar :color="val.color" size="44" class="mb-3">
                                                    <v-icon :icon="val.icon" size="24" />
                                                </v-avatar>
                                                <div class="text-body-2 font-weight-bold mb-1">{{ val.title }}</div>
                                                <div class="text-caption text-medium-emphasis">{{ val.desc }}</div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </template>

                            <template v-else-if="activePage === 'privacy'">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar size="48" color="success">
                                        <v-icon icon="mdi-shield-lock" size="26" />
                                    </v-avatar>
                                    <div>
                                        <div class="text-h5 font-weight-bold">Privacy Policy</div>
                                        <div class="text-caption text-medium-emphasis">Effective date · 1 January 2026 ·
                                            Version 2.1</div>
                                    </div>
                                </div>

                                <v-divider class="mb-6" />

                                <v-tabs v-model="privacyTab" color="primary" density="comfortable" class="mb-4">
                                    <v-tab v-for="tab in privacyTabs" :key="tab.value" :value="tab.value"
                                        :prepend-icon="tab.icon">
                                        {{ tab.label }}
                                    </v-tab>
                                </v-tabs>

                                <v-divider class="mb-4" />

                                <v-window v-model="privacyTab">
                                    <v-window-item v-for="tab in privacyTabs" :key="tab.value" :value="tab.value">
                                        <v-row>
                                            <v-col v-for="item in privacySections[tab.value]" :key="item.title"
                                                cols="12" md="6">
                                                <v-card elevation="1" height="100%">
                                                    <v-card-item>
                                                        <template #prepend>
                                                            <v-avatar :color="item.color" size="34">
                                                                <v-icon :icon="item.icon" size="18" />
                                                            </v-avatar>
                                                        </template>
                                                        <v-card-title class="text-body-2 font-weight-bold">{{ item.title
                                                        }}</v-card-title>
                                                    </v-card-item>
                                                    <v-divider />
                                                    <v-card-text class="text-body-2 text-medium-emphasis"
                                                        style="line-height:1.7">
                                                        {{ item.body }}
                                                        <v-alert v-if="item.highlight" type="info" density="compact"
                                                            class="mt-3 text-caption" :text="item.highlight" />
                                                    </v-card-text>
                                                </v-card>
                                            </v-col>
                                        </v-row>
                                    </v-window-item>
                                </v-window>
                            </template>

                            <template v-else-if="activePage === 'terms'">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar size="48" color="warning">
                                        <v-icon icon="mdi-file-document-outline" size="26" />
                                    </v-avatar>
                                    <div>
                                        <div class="text-h5 font-weight-bold">Terms of Service</div>
                                        <div class="text-caption text-medium-emphasis">Effective date · 1 January 2026 ·
                                            Version 1.4</div>
                                    </div>
                                </div>

                                <v-divider class="mb-6" />

                                <div class="d-flex ga-4" style="align-items: flex-start;">
                                    <div style="width: 200px; flex-shrink: 0; position: sticky; top: 0;">
                                        <v-card elevation="1">
                                            <v-card-item class="pb-1">
                                                <v-card-title
                                                    class="text-caption text-uppercase font-weight-bold text-medium-emphasis">In
                                                    this document</v-card-title>
                                            </v-card-item>
                                            <v-list density="compact" nav class="pa-2">
                                                <v-list-item v-for="(term, i) in terms" :key="i"
                                                    :prepend-icon="term.icon" :title="`${i + 1}. ${term.title}`"
                                                    :active="openPanels.includes(i)" :active-color="term.color"
                                                    rounded="lg" class="text-caption"
                                                    @click="openPanels.includes(i) ? openPanels.splice(openPanels.indexOf(i), 1) : openPanels.push(i)" />
                                            </v-list>
                                        </v-card>
                                    </div>

                                    <div class="flex-grow-1" style="min-width: 0;">
                                        <v-expansion-panels v-model="openPanels" multiple variant="accordion">
                                            <v-expansion-panel v-for="(term, i) in terms" :key="i" :value="i">
                                                <v-expansion-panel-title>
                                                    <div class="d-flex align-center ga-3">
                                                        <v-avatar :color="term.color" size="30">
                                                            <v-icon :icon="term.icon" size="16" />
                                                        </v-avatar>
                                                        <span class="text-body-2 font-weight-medium">
                                                            {{ i + 1 }}. {{ term.title }}
                                                        </span>
                                                    </div>
                                                </v-expansion-panel-title>
                                                <v-expansion-panel-text>
                                                    <div class="text-body-2 text-medium-emphasis"
                                                        style="white-space: pre-line; line-height: 1.8;">
                                                        {{ term.body }}
                                                    </div>
                                                </v-expansion-panel-text>
                                            </v-expansion-panel>
                                        </v-expansion-panels>
                                    </div>
                                </div>
                            </template>

                            <template v-else-if="activePage === 'help'">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar size="48" color="primary">
                                        <v-icon icon="mdi-frequently-asked-questions" size="26" />
                                    </v-avatar>

                                    <div>
                                        <div class="text-h5 font-weight-bold">
                                            Frequently Asked Questions
                                        </div>
                                        <div class="text-caption text-medium-emphasis">
                                            Find answers to common questions about the Healthcare ERP platform.
                                        </div>
                                    </div>
                                </div>

                                <v-divider class="mb-6" />

                                <v-alert type="info" class="mb-6" icon="mdi-lightbulb-outline">
                                    Can't find what you're looking for? Contact your system administrator or our support
                                    team.
                                </v-alert>

                                <v-row>
                                    <v-col v-for="category in faqCategories" :key="category.title" cols="12" md="6">
                                        <v-card elevation="1" height="100%">
                                            <v-card-item>
                                                <template #prepend>
                                                    <v-avatar color="primary">
                                                        <v-icon :icon="category.icon" />
                                                    </v-avatar>
                                                </template>

                                                <v-card-title>
                                                    {{ category.title }}
                                                </v-card-title>
                                            </v-card-item>

                                            <v-divider />

                                            <v-expansion-panels v-model="faqPanel" multiple variant="accordion">
                                                <v-expansion-panel v-for="(faq, index) in category.items"
                                                    :key="faq.question" :value="`${category.title}-${index}`">
                                                    <v-expansion-panel-title>
                                                        {{ faq.question }}
                                                    </v-expansion-panel-title>

                                                    <v-expansion-panel-text class="text-medium-emphasis">
                                                        {{ faq.answer }}
                                                    </v-expansion-panel-text>
                                                </v-expansion-panel>
                                            </v-expansion-panels>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </template>

                            <template v-else>
                                <div class="text-center py-16 text-medium-emphasis">
                                    <v-icon icon="mdi-hammer-wrench" size="48" class="mb-3 d-block mx-auto" />
                                    <div class="text-body-1">This section is coming soon.</div>
                                </div>
                            </template>

                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
