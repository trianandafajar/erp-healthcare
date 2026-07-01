<script setup lang="ts">
import { ref, watch } from 'vue'

interface HeroData {
    title: string
    description: string
    image_url: string
}

interface Feature {
    icon: string
    title: string
    description: string
}

interface FaqItem {
    icon: string
    question: string
    answer: string
    image_url: string
}

interface FaqItemUpload {
    file: File | null
    preview: string
    uploading: boolean
    error: string
    dragging: boolean
}

interface FaqSection {
    title: string
    titleHighlight: string
    titleSuffix: string
    description: string
    items: FaqItem[]
}

interface CtaData {
    title: string
    button_text: string
    button_link: string
}

interface ContentData {
    hero: HeroData | null
    features: Feature[]
    faq: FaqSection | null
    cta: CtaData | null
}

const props = defineProps<{
    content: ContentData | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'save', content: ContentData): void
    (e: 'cancel'): void
}>()

const hero = ref<HeroData>({ title: '', description: '', image_url: '' })
const heroPhotoFile = ref<File | null>(null)
const heroPhotoPreview = ref<string>('')
const heroUploading = ref(false)
const heroPhotoError = ref<string>('')
const heroPhotoInputRef = ref<HTMLInputElement | null>(null)
const heroDragging = ref(false)

const features = ref<Feature[]>([])
const faq = ref<FaqSection>({ title: '', titleHighlight: '', titleSuffix: '', description: '', items: [] })
const faqPhotoFile = ref<File | null>(null)
const faqPhotoPreview = ref<string>('')
const faqUploading = ref(false)
const faqPhotoError = ref<string>('')
const faqPhotoInputRef = ref<HTMLInputElement | null>(null)
const faqDragging = ref(false)
const faqItemUploads = ref<FaqItemUpload[]>([])
const cta = ref<CtaData>({ title: '', button_text: '', button_link: '' })

watch(
    () => props.content,
    (val) => {
        if (val) {
            hero.value = val.hero ?? { title: '', description: '', image_url: '' }
            heroPhotoPreview.value = val.hero?.image_url || ''
            features.value = val.features ?? []
            const f = val.faq
            const items = f?.items ?? []
            faq.value = {
                title: f?.title ?? '',
                titleHighlight: f?.titleHighlight ?? '',
                titleSuffix: f?.titleSuffix ?? '',
                description: f?.description ?? '',
                items: items.map(i => ({ ...i, image_url: i.image_url ?? '' })),
            }
            faqItemUploads.value = items.map(i => ({
                file: null,
                preview: i.image_url || '',
                uploading: false,
                error: '',
                dragging: false,
            }))
            cta.value = val.cta ?? { title: '', button_text: '', button_link: '' }
        }
    },
    { immediate: true }
)

function triggerHeroInput() {
    heroPhotoInputRef.value?.click()
}

function validateFile(file: File): string | null {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.'
    if (file.size > 2 * 1024 * 1024) return 'Image must be smaller than 2 MB.'
    return null
}

function applyHeroFile(file: File) {
    const err = validateFile(file)
    if (err) {
        heroPhotoError.value = err
        return
    }
    heroPhotoError.value = ''
    heroPhotoFile.value = file
    if (heroPhotoPreview.value.startsWith('blob:')) URL.revokeObjectURL(heroPhotoPreview.value)
    heroPhotoPreview.value = URL.createObjectURL(file)
}

function onHeroFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) applyHeroFile(file)
}

function onHeroDragOver(event: DragEvent) {
    event.preventDefault()
    heroDragging.value = true
}

function onHeroDragLeave() {
    heroDragging.value = false
}

function onHeroDrop(event: DragEvent) {
    event.preventDefault()
    heroDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) applyHeroFile(file)
}

function removeHeroPhoto() {
    if (heroPhotoPreview.value.startsWith('blob:')) URL.revokeObjectURL(heroPhotoPreview.value)
    heroPhotoFile.value = null
    heroPhotoPreview.value = ''
    heroPhotoError.value = ''
    hero.value.image_url = ''
    if (heroPhotoInputRef.value) heroPhotoInputRef.value.value = ''
}

async function uploadHeroPhoto(): Promise<string> {
    if (!heroPhotoFile.value) return hero.value.image_url
    heroUploading.value = true
    try {
        const body = new FormData()
        body.append('file', heroPhotoFile.value)
        const result = await $fetch<{ url: string }>('/api/upload/industry-photo', { method: 'POST', body })
        hero.value.image_url = result.url
        return result.url
    } finally {
        heroUploading.value = false
    }
}

function applyFaqItemFile(index: number, file: File) {
    const u = faqItemUploads.value[index]
    if (!u) return
    const err = validateFile(file)
    if (err) {
        u.error = err
        return
    }
    u.error = ''
    u.file = file
    if (u.preview.startsWith('blob:')) {
        URL.revokeObjectURL(u.preview)
    }
    u.preview = URL.createObjectURL(file)
}

function onFaqItemDragOver(index: number) {
    const u = faqItemUploads.value[index]
    if (u) u.dragging = true
}

function onFaqItemFileChange(index: number, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) applyFaqItemFile(index, file)
}

function onFaqItemDragLeave(index: number) {
    const u = faqItemUploads.value[index]
    if (u) u.dragging = false
}

function onFaqItemDrop(index: number, event: DragEvent) {
    const u = faqItemUploads.value[index]
    if (u) u.dragging = false
    const file = event.dataTransfer?.files?.[0]
    if (file) applyFaqItemFile(index, file)
}

function triggerFaqItemInput(index: number) {
    const u = faqItemUploads.value[index]
    if (u && (u as any).inputRef) {
        ; (u as any).inputRef.click()
    }
}

function removeFaqItemPhoto(index: number) {
    const u = faqItemUploads.value[index]
    if (!u) return
    if (u.preview.startsWith('blob:')) URL.revokeObjectURL(u.preview)
    u.file = null
    u.preview = ''
    u.error = ''
    if (faq.value.items[index]) faq.value.items[index].image_url = ''
}

async function uploadFaqItemPhoto(index: number): Promise<string> {
    const u = faqItemUploads.value[index]
    const item = faq.value.items[index]
    if (!u || !item || !u.file) return item?.image_url ?? ''
    u.uploading = true
    try {
        const body = new FormData()
        body.append('file', u.file)
        const result = await $fetch<{ url: string }>('/api/upload/industry-photo', { method: 'POST', body })
        item.image_url = result.url
        return result.url
    } finally {
        u.uploading = false
    }
}

function addFeature() {
    features.value.push({ icon: 'mdi-check-circle', title: '', description: '' })
}

function removeFeature(index: number) {
    features.value.splice(index, 1)
}

function addFaq() {
    faq.value.items.push({ icon: 'mdi-help-circle-outline', question: '', answer: '', image_url: '' })
    faqItemUploads.value.push({ file: null, preview: '', uploading: false, error: '', dragging: false })
}

function removeFaq(index: number) {
    faq.value.items.splice(index, 1)
    faqItemUploads.value.splice(index, 1)
}

async function onSubmit() {
    if (heroPhotoFile.value) {
        await uploadHeroPhoto()
    }
    for (let i = 0; i < faq.value.items.length; i++) {
        if (faqItemUploads.value[i]?.file) {
            await uploadFaqItemPhoto(i)
        }
    }

    const filteredItems = faq.value.items.filter(f => f.question)
    const hasFaqItems = filteredItems.length > 0
    const faqSection = hasFaqItems || faq.value.title || faq.value.description
        ? {
            title: faq.value.title,
            titleHighlight: faq.value.titleHighlight,
            titleSuffix: faq.value.titleSuffix,
            description: faq.value.description,
            items: filteredItems,
        }
        : null

    emit('save', {
        hero: hero.value.title ? { ...hero.value } : null,
        features: features.value.filter(f => f.title),
        faq: faqSection,
        cta: cta.value.title ? { ...cta.value } : null,
    })
}
</script>

<template>
    <v-form @submit.prevent="onSubmit">
        <UiTitleCard class-name="px-0 pb-0 rounded-md">
            <v-card-text class="pa-4">
                <span class="text-h6 font-weight-bold">Hero</span>
                <p class="text-caption text-medium-emphasis mt-1 mb-3">
                    Hero section banner at the top of the detail page
                </p>

                <v-divider class="mb-4" />

                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Title</v-label>
                        <v-text-field v-model="hero.title" placeholder="e.g. Complete Hospital Management"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Description</v-label>
                        <v-textarea v-model="hero.description" placeholder="Hero description..." variant="outlined"
                            density="compact" rows="2" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Image</v-label>
                        <div class="d-flex ga-3 align-stretch">
                            <v-avatar size="80" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                <v-img v-if="heroPhotoPreview" :src="heroPhotoPreview" cover />
                                <v-icon v-else icon="mdi-image-outline" size="40" color="grey-lighten-1" />
                            </v-avatar>

                            <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                :class="{
                                    'photo-dropzone--dragging': heroDragging,
                                    'photo-dropzone--error': !!heroPhotoError
                                }" @dragover="onHeroDragOver" @dragleave="onHeroDragLeave" @drop="onHeroDrop"
                                @click="triggerHeroInput">
                                <v-icon :icon="heroDragging ? 'mdi-cloud-download-outline' : 'mdi-image-plus-outline'"
                                    size="24" :color="heroDragging ? 'primary' : 'grey'" />
                                <span class="text-caption font-weight-medium">
                                    {{ heroDragging ? 'Drop to upload' : 'Click or drag & drop' }}
                                </span>
                                <span class="text-caption text-medium-emphasis">
                                    JPG, PNG, WebP · Max 2 MB
                                </span>
                            </div>

                            <input ref="heroPhotoInputRef" type="file" accept="image/jpeg,image/png,image/webp"
                                style="display: none" @change="onHeroFileChange" />
                        </div>

                        <div v-if="heroPhotoError" class="text-caption text-error mt-1 d-flex align-center ga-1">
                            <v-icon icon="mdi-alert-circle-outline" size="14" />
                            {{ heroPhotoError }}
                        </div>

                        <div v-if="heroPhotoPreview" class="mt-2">
                            <v-btn variant="text" color="error" size="small" prepend-icon="mdi-delete-outline"
                                @click="removeHeroPhoto">
                                Remove image
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <v-divider class="my-4" />
                <div class="d-flex align-center justify-space-between mb-3">
                    <div>
                        <span class="text-h6 font-weight-bold">Features</span>
                        <p class="text-caption text-medium-emphasis mt-1">
                            Feature cards displayed on the industry detail page
                        </p>
                    </div>
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" size="small" @click="addFeature">
                        Add Feature
                    </v-btn>
                </div>

                <v-divider class="mb-4" />

                <div v-if="features.length === 0" class="text-center py-6 text-medium-emphasis">
                    <v-icon icon="mdi-view-grid-plus-outline" size="32" class="mb-2" />
                    <p class="text-body-2">No features yet. Click "Add Feature" to create one.</p>
                </div>

                <v-row v-else dense>
                    <v-col v-for="(feature, index) in features" :key="index" cols="12" md="6">
                        <v-card variant="outlined" class="mb-3">
                            <v-card-text class="pa-3">
                                <div class="d-flex align-center justify-space-between mb-2">
                                    <span class="text-subtitle-2 font-weight-bold">Feature {{ index + 1 }}</span>
                                    <v-btn icon="mdi-close" variant="text" density="compact" size="small" color="error"
                                        @click="removeFeature(index)" />
                                </div>

                                <v-row dense>
                                    <v-col cols="12" sm="4">
                                        <v-label class="text-caption font-weight-medium mb-1">Icon</v-label>
                                        <v-text-field v-model="feature.icon" placeholder="mdi-check-circle"
                                            variant="outlined" density="compact" hide-details />
                                    </v-col>

                                    <v-col cols="12" sm="8">
                                        <v-label class="text-caption font-weight-medium mb-1">Title</v-label>
                                        <v-text-field v-model="feature.title"
                                            placeholder="e.g. Complete Patient Records" variant="outlined"
                                            density="compact" hide-details />
                                    </v-col>

                                    <v-col cols="12" class="mt-2">
                                        <v-label class="text-caption font-weight-medium mb-1">Description</v-label>
                                        <v-textarea v-model="feature.description" placeholder="Describe this feature..."
                                            variant="outlined" density="compact" rows="2" hide-details />
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <v-divider class="my-4" />
                <span class="text-h6 font-weight-bold">FAQ</span>
                <p class="text-caption text-medium-emphasis mt-1 mb-3">
                    Frequently asked questions section
                </p>

                <v-divider class="mb-4" />

                <v-row dense>
                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Section Title</v-label>
                        <v-text-field v-model="faq.title" placeholder="e.g. Why Choose" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Title Highlight</v-label>
                        <v-text-field v-model="faq.titleHighlight" placeholder="e.g. Hospital ERP" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Title Suffix</v-label>
                        <v-text-field v-model="faq.titleSuffix" placeholder="e.g. for Modern Healthcare"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Description</v-label>
                        <v-textarea v-model="faq.description" placeholder="Section description..." variant="outlined"
                            density="compact" rows="2" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-divider class="mb-3" />
                        <div class="d-flex align-center justify-space-between">
                            <span class="text-subtitle-2 font-weight-bold">FAQ Items</span>
                            <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" size="small" @click="addFaq">
                                Add Item
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <div v-if="faq.items.length === 0" class="text-center py-6 text-medium-emphasis">
                    <v-icon icon="mdi-frequently-asked-questions" size="32" class="mb-2" />
                    <p class="text-body-2">No FAQ items yet. Click "Add Item" to create one.</p>
                </div>

                <div v-else>
                    <v-card v-for="(item, index) in faq.items" :key="index" variant="outlined" class="mb-3">
                        <v-card-text class="pa-3">
                            <div class="d-flex align-center justify-space-between mb-2">
                                <span class="text-subtitle-2 font-weight-bold">FAQ {{ index + 1 }}</span>
                                <v-btn icon="mdi-close" variant="text" density="compact" size="small" color="error"
                                    @click="removeFaq(index)" />
                            </div>

                            <v-row dense>
                                <v-col cols="12" sm="4">
                                    <v-label class="text-caption font-weight-medium mb-1">Icon</v-label>
                                    <v-text-field v-model="item.icon" placeholder="mdi-help-circle-outline"
                                        variant="outlined" density="compact" hide-details />
                                </v-col>

                                <v-col cols="12" sm="8">
                                    <v-label class="text-caption font-weight-medium mb-1">Question</v-label>
                                    <v-text-field v-model="item.question" placeholder="e.g. What services do you offer?"
                                        variant="outlined" density="compact" hide-details />
                                </v-col>

                                <v-col cols="12" class="mt-2">
                                    <v-label class="text-caption font-weight-medium mb-1">Answer</v-label>
                                    <v-textarea v-model="item.answer" placeholder="Answer here..." variant="outlined"
                                        density="compact" rows="2" hide-details />
                                </v-col>

                                <v-col cols="12" class="mt-2">
                                    <v-label class="text-caption font-weight-medium mb-1">Image</v-label>
                                    <div class="d-flex ga-2 align-stretch">
                                        <v-avatar size="56" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                            <v-img v-if="faqItemUploads[index]?.preview"
                                                :src="faqItemUploads[index].preview" cover />
                                            <v-icon v-else icon="mdi-image-outline" size="28" color="grey-lighten-1" />
                                        </v-avatar>

                                        <div class="photo-dropzone photo-dropzone--sm flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                            :class="{
                                                'photo-dropzone--dragging': faqItemUploads[index]?.dragging,
                                                'photo-dropzone--error': !!faqItemUploads[index]?.error
                                            }" @dragover.prevent="onFaqItemDragOver(index)"
                                            @dragleave="onFaqItemDragLeave(index)"
                                            @drop.prevent="onFaqItemDrop(index, $event)"
                                            @click="triggerFaqItemInput(index)">
                                            <v-icon icon="mdi-image-plus-outline" size="20" color="grey" />
                                            <span class="text-caption">Upload photo</span>
                                        </div>

                                        <input type="file" accept="image/jpeg,image/png,image/webp"
                                            style="display: none"
                                            :ref="(el: any) => { if (faqItemUploads[index]) (faqItemUploads[index] as any).inputRef = el }"
                                            @change="onFaqItemFileChange(index, $event)" />

                                        <input type="file" accept="image/jpeg,image/png,image/webp"
                                            style="display: none"
                                            :ref="(el: any) => { if (faqItemUploads[index]) (faqItemUploads[index] as any).inputRef = el }"
                                            @change="const f = ($event.target as HTMLInputElement).files?.[0]; if (f) applyFaqItemFile(index, f)" />
                                    </div>

                                    <div v-if="faqItemUploads[index]?.error"
                                        class="text-caption text-error mt-1 d-flex align-center ga-1">
                                        <v-icon icon="mdi-alert-circle-outline" size="14" />
                                        {{ faqItemUploads[index].error }}
                                    </div>

                                    <div v-if="faqItemUploads[index]?.preview" class="mt-1">
                                        <v-btn variant="text" color="error" size="x-small"
                                            prepend-icon="mdi-delete-outline" @click="removeFaqItemPhoto(index)">
                                            Remove
                                        </v-btn>
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>

                <v-divider class="my-4" />
                <span class="text-h6 font-weight-bold">Call to Action</span>
                <p class="text-caption text-medium-emphasis mt-1 mb-3">
                    Optional CTA banner at the bottom of the detail page
                </p>

                <v-divider class="mb-4" />

                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">CTA Title</v-label>
                        <v-text-field v-model="cta.title" placeholder="e.g. Ready to get started?" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Button Text</v-label>
                        <v-text-field v-model="cta.button_text" placeholder="e.g. Contact Us" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Button Link</v-label>
                        <v-text-field v-model="cta.button_link" placeholder="e.g. /contact" variant="outlined"
                            density="compact" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
        </UiTitleCard>

        <div class="d-flex justify-end ga-3 mt-4">
            <v-btn variant="tonal" color="secondary" :disabled="loading || heroUploading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" color="primary" :loading="loading || heroUploading"
                :disabled="loading || heroUploading" type="submit">
                Save Content
            </v-btn>
        </div>
    </v-form>
</template>

<style scoped>
.photo-dropzone {
    height: 80px;
    min-height: 80px;
    border: 2px dashed rgba(var(--v-border-color), 0.4);
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    text-align: center;
    overflow: hidden;
}

.photo-dropzone:hover {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.photo-dropzone--dragging {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.photo-dropzone--error {
    border-color: rgb(var(--v-theme-error));
}

.photo-dropzone--sm {
    height: 56px;
    min-height: 56px;
}
</style>
