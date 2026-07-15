<template>
    <div class="page-shell">
        <!-- Main Content -->
        <div class="page-panel container">
            <div class="page-header">
                <div class="inline-flex items-center gap-3 mb-2">
                    <div class="w-11 h-11 bg-gradient-to-br from-sky-500 to-sky-400 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
                        <i class="pi pi-users text-white text-lg"></i>
                    </div>
                    <h1 class="section-title !mb-0">{{ $t('student_parliament') }}</h1>
                </div>
                <div class="section-accent"></div>
                <p class="page-subtitle">{{ $t('sp_subtitle') }}</p>
            </div>

            <!-- Debug Info -->
            <div v-if="debugMode" class="glass rounded-xl p-4 text-sm mb-6">
                <h3 class="font-bold mb-2">Debug Info:</h3>
                <p><strong>Loading:</strong> {{ loading }}</p>
                <p><strong>Members count:</strong> {{ parliamentMembers.length }}</p>
                <p><strong>Current locale:</strong> {{ currentLocale }}</p>
                <div v-if="parliamentMembers.length > 0">
                    <p><strong>First member:</strong></p>
                    <pre>{{ JSON.stringify(parliamentMembers[0], null, 2) }}</pre>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="page-state">
                <div class="page-spinner"></div>
                <p class="page-state-text mt-4">{{ $t('loading_data') }}</p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="page-state">
                <h3 class="page-state-title">{{ $t('error') || 'Hiba történt' }}</h3>
                <p class="page-state-text">{{ error }}</p>
                <button 
                    @click="loadData"
                    class="glass-btn inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-full"
                >
                    Újrapróbálás
                </button>
                <button 
                    @click="debugMode = !debugMode"
                    class="btn-ghost-glass ml-3"
                >
                    Debug {{ debugMode ? 'ki' : 'be' }}
                </button>
            </div>

            <!-- Parliament Members Table -->
            <div v-if="!loading && !error && sortedMembers.length > 0" class="page-table-wrap overflow-hidden">
                <!-- Table Header -->
                <div class="page-table-bar">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-white/15 rounded-lg">
                                <i class="pi pi-users"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold">{{ $t('members_heading') }}</h3>
                                <p class="text-white/80 text-sm">{{ sortedMembers.length }} {{ $t("member") }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ $t('name') }}</th>
                                <th>{{ $t('class') }}</th>
                                <th>{{ $t('_role') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(member, index) in sortedMembers" 
                                :key="member.$id || member.id"
                                class="group"
                            >
                                <!-- Number -->
                                <td class="px-6 py-4">
                                    <div 
                                        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        :class="member.is_president ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'"
                                    >
                                        {{ index + 1 }}
                                    </div>
                                </td>
                                
                                <!-- Name -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="text-base font-semibold text-gray-900 dark:text-white">
                                            {{ getDisplayName(member) }}
                                        </div>
                                        <div v-if="member.is_president" class="flex items-center">
                                            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <!-- Debug név -->
                                    <div v-if="debugMode" class="text-xs text-gray-500 mt-1">
                                        HU: "{{ member.parliament_member_name_hu }}" | 
                                        RS: "{{ member.parliament_member_name_rs }}"
                                    </div>
                                </td>
                                
                                <!-- Class -->
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 group-hover:bg-gray-200 transition-colors duration-200">
                                        {{ getClassName(member) }}
                                    </span>
                                </td>
                                
                                <!-- Role -->
                                <td class="px-6 py-4">
                                    <span 
                                        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-200"
                                        :class="getRoleBadgeClass(member)"
                                    >
                                        <svg v-if="member.is_president" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                        </svg>
                                        {{$t(member.position)}}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!loading && !error && sortedMembers.length === 0" class="text-center py-20">
                <div class="max-w-md mx-auto">
                    <div class="text-gray-400 mb-6">
                        <svg class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('no_parliament_members_found') }}</h3>
                    <p class="text-gray-600 mb-6">{{ $t("no_members_paragraph") }}</p>
                    <div class="flex gap-4 justify-center">
                        <button 
                            @click="loadData"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            {{ $t('reload') }}
                        </button>
                        <button 
                            @click="debugMode = !debugMode"
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Debug {{ debugMode ? 'ki' : 'be' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Databases, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import {useLoadingStore} from "@/stores/loading";

const database = new Databases(appw);
import {convertifserbian} from "@/lang";

interface ParliamentMember {
    $id?: string;
    id?: string;
    is_president: boolean;
    position: string;
    description: string;
    classList: any;
    parliament_member_name_hu: string;
    parliament_member_name_rs: string;
    parliament_description_hu: string;
    parliament_description_rs: string;
}

export default {
    data() {
        return {
            loading: true,
            error: null as string | null,
            debugMode: false,
            parliamentMembers: [] as ParliamentMember[],
            classes: [] as any[],
            currentLocale: 'hu'
        }
    },

    computed: {
        currentLanguage() {
            return useLoadingStore().language;
        },

        sortedMembers(): ParliamentMember[] {
            if (!this.parliamentMembers.length) return [];

            return [...this.parliamentMembers].sort((a, b) => {
                // 1. Speciális pozíciók (elnökök és tisztségviselők) előre
                const isSpecialA = a.is_president || (a.position && a.position !== 'member');
                const isSpecialB = b.is_president || (b.position && b.position !== 'member');

                if (isSpecialA && !isSpecialB) return -1;
                if (!isSpecialA && isSpecialB) return 1;

                // 2. Ha mindketten speciálisak, akkor pozíciók szerint
                if (isSpecialA && isSpecialB) {
                    // Elnökök mindig előre
                    if (a.is_president && !b.is_president) return -1;
                    if (!a.is_president && b.is_president) return 1;

                    // Ha mindketten elnökök vagy sem, akkor pozíciók szerint
                    const positionOrder = ['vice_president', 'secretary', 'treasurer', 'member'];
                    const aPos = positionOrder.indexOf(a.position || 'member');
                    const bPos = positionOrder.indexOf(b.position || 'member');
                    if (aPos !== bPos) return aPos - bPos;
                }

                // 3. Ha mindketten normál tagok, akkor évfolyam és osztály szerint
                if (!isSpecialA && !isSpecialB) {
                    const aClass = this.getClassInfo(a);
                    const bClass = this.getClassInfo(b);

                    // Évfolyam szerint növekvő sorrend
                    if (aClass.year !== bClass.year) {
                        return aClass.year - bClass.year;
                    }

                    // Ugyanaz az évfolyam esetén osztály szerint
                    if (aClass.designation !== bClass.designation) {
                        return aClass.designation - bClass.designation;
                    }
                }

                // 4. Végső esetben név szerint
                const aName = this.getDisplayName(a);
                const bName = this.getDisplayName(b);
                return aName.localeCompare(bName);
            });
        }
    },

    watch: {
        currentLanguage(newLang, oldLang) {
            if (newLang !== oldLang) {
                this.loadData();
            }
        }
    },

    async mounted() {
        this.currentLocale = this.$i18n?.locale || 'hu';
        await this.loadData();
    },

    methods: {
        async loadData() {
            this.loading = true;
            this.error = null;
            
            try {
                await Promise.all([
                    this.loadClasses(),
                    this.loadParliamentMembers()
                ]);
            } catch (error: any) {
                console.error('Data load error:', error);
                this.error = error.message || 'Hiba az adatok betöltésében';
            } finally {
                this.loading = false;
            }
        },

        async loadClasses() {
            try {
                const response = await database.listDocuments(
                    config.website_db, 
                    config.classlist, 
                    [Query.limit(150), Query.orderAsc('year')]
                );

                this.classes = response.documents.map((doc: any) => ({
                    id: doc.$id,
                    year: doc.year,
                    designation: doc.designation,
                    name: this.getClassNameById(doc.year, doc.designation)
                }));
                
            } catch (error: any) {
                console.error('Classes load error:', error);
                throw new Error(`Osztályok betöltési hiba: ${error.message}`);
            }
        },

        async loadParliamentMembers() {
            try {
                const response = await database.listDocuments(
                    config.website_db,
                    config.parliament_members,
                    [Query.limit(200)]
                );

                this.parliamentMembers = response.documents.map((doc: any) => ({
                    $id: doc.$id,
                    id: doc.$id,
                    is_president: doc.is_president || false,
                    position: doc.position || 'member',
                    description: doc.description || '',
                    classList: doc.classList,
                    parliament_member_name_hu: doc.parliament_member_name_hu || '',
                    parliament_member_name_rs: convertifserbian(doc.parliament_member_name_rs) || '',
                    parliament_description_hu: doc.parliament_description_hu || '',
                    parliament_description_rs: convertifserbian(doc.parliament_description_rs) || ''
                }));

            } catch (error: any) {
                console.error('Members load error:', error);
                throw new Error(`Parlament tagok betöltési hiba: ${error.message}`);
            }
        },

        getClassNameById(year: number, designation: number): string {
            const yearMap: { [key: number]: string } = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
            return `${yearMap[year] || year}-${designation}`;
        },

        getClassName(member: ParliamentMember): string {
            // Kezeli mind az objektum (régi Appwrite), mind a string ID (új Appwrite) formátumot
            const classId = this.getClassIdFromMember(member);
            if (classId) {
                const classData = this.classes.find(c => c.id === classId);
                return classData ? classData.name : 'Ismeretlen osztály';
            }
            return 'Nincs osztály';
        },

        getClassInfo(member: ParliamentMember): { year: number, designation: number } {
            // Kezeli mind az objektum (régi Appwrite), mind a string ID (új Appwrite) formátumot
            const classId = this.getClassIdFromMember(member);
            if (classId) {
                const classData = this.classes.find(c => c.id === classId);
                if (classData) {
                    return {
                        year: classData.year || 999, // 999 = ismeretlen évfolyam, hátulra kerül
                        designation: classData.designation || 999
                    };
                }
            }

            // Ha nincs osztály információ, hátulra tesszük
            return { year: 999, designation: 999 };
        },

        /**
         * Kiolvassa az osztály ID-t a tagból - kezeli mind a string ID-t (új Appwrite),
         * mind a beágyazott objektumot (régi Appwrite)
         */
        getClassIdFromMember(member: ParliamentMember): string | null {
            if (!member.classList) return null;

            // Ha string, akkor ez már az ID (új Appwrite verzió)
            if (typeof member.classList === 'string') {
                return member.classList;
            }

            // Ha objektum, akkor a $id vagy id mezőt keressük (régi Appwrite verzió)
            if (typeof member.classList === 'object') {
                return member.classList.$id || member.classList.id || null;
            }

            return null;
        },

        getDisplayName(member: ParliamentMember): string {
            const cc=useLoadingStore();
            if (cc.language == 'rs'||cc.language == 'sr') {
                return member.parliament_member_name_rs || member.parliament_member_name_hu || 'Névtelen';
            } else {
                return member.parliament_member_name_hu || member.parliament_member_name_rs || 'Névtelen';
            }
        },

        getDisplayDescription(member: ParliamentMember): string {
            if (this.currentLocale === 'rs') {
                return member.parliament_description_rs || member.parliament_description_hu || '';
            } else {
                return member.parliament_description_hu || member.parliament_description_rs || '';
            }
        },

        getRoleTitle(member: ParliamentMember): string {
            const key = member.is_president ? 'role.president' : `role.${member.position || 'member'}`;
            return this.$t(key) as string;
        },

        getRoleBadgeClass(member: ParliamentMember): string {
            if (member.is_president) {
                return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-400 shadow-lg';
            }
            switch (member.position) {
                case 'vice_president':
                    return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-md';
                case 'secretary':
                    return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-md';
                case 'treasurer':
                    return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-md';
                default:
                    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400 shadow-sm';
            }
        }
    }
}
</script>

<style scoped>
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.bg-white { animation: fadeInUp 0.6s ease-out forwards; }
</style>