<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <!-- Hero Header -->
        <div class="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
            <div class="absolute inset-0 bg-black/20"></div>
            <!-- Background decoration -->
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div class="relative container mx-auto px-6 py-12">
                <div class="max-w-4xl">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                        <h1 class="text-4xl font-bold text-white tracking-tight">{{ $t('student_parliament') }}</h1>
                    </div>
                    <p class="text-blue-100 text-lg mb-6 leading-relaxed">
                        {{ $t('sp_subtitle') }}
                    </p>
                    <div v-if="false" class="flex flex-wrap gap-4 text-sm">
                        <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                            <svg class="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span class="text-blue-100">{{ $t('date') }}: {{ currentDate }}</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                            <svg class="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            <span class="text-blue-100">{{ $t('last_update') }}: {{ lastUpdate }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-6 py-8">
            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-20">
                <div class="relative">
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p class="mt-4 text-gray-600 font-medium">{{ $t('loading_data') }}</p>
            </div>

            <!-- Parliament Members Table -->
            <div v-if="!loading && allMembers.length > 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Table Header -->
                <div class="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-white/10 rounded-lg">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">{{ $t('members_heading') }}</h3>
                            <p class="text-gray-300 text-sm">{{ $t('members_subheading') }}</p>
                        </div>
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">#</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t('name') }}</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t('class') }}</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t('role') }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr 
                                v-for="(member, index) in allMembers" 
                                :key="member.id"
                                class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
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
                                        <div class="text-base font-semibold text-gray-900">{{ member.name }}</div>
                                        <div v-if="member.is_president" class="flex items-center" :aria-label="$t('role.president')">
                                            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        </div>
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
                                        {{ getRoleTitle(member) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!loading && parliamentMembers.length === 0" class="text-center py-20">
                <div class="max-w-md mx-auto">
                    <div class="text-gray-400 mb-6">
                        <svg class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('no_parliament_members_found') }}</h3>
                    <p class="text-gray-600">{{ $t('no_members_paragraph') }}</p>
                    <div class="mt-6">
                        <button 
                            @click="loadData"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            {{ $t('reload') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="false" class="bg-white border-t border-gray-200 py-8 mt-12">
            <div class="container mx-auto px-6">
                <div  class="text-center text-gray-500 text-sm">
                    <p>{{ $t('student_parliament') }} • {{ new Date().getFullYear() }} • {{ $t('last_update') }}: {{ lastUpdate }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Client, Databases, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";

interface ParliamentMember {
    id: string;
    name: string;
    is_president: boolean;
    position: string;
    description: string;
    classList: any;
}

export default {
    data() {
        return {
            loading: true,
            parliamentMembers: [] as ParliamentMember[],
            classes: [] as any[],
            currentDate: new Date().toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            lastUpdate: new Date().toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    },

    computed: {
        allMembers(): ParliamentMember[] {
            // Elnök(ök) előre, majd pozíció szerint, végül név szerint
            return [...this.parliamentMembers].sort((a, b) => {
                if (a.is_president && !b.is_president) return -1;
                if (!a.is_president && b.is_president) return 1;

                const positionOrder = ['vice_president', 'secretary', 'treasurer', 'member'];
                const aPos = positionOrder.indexOf(a.position);
                const bPos = positionOrder.indexOf(b.position);
                if (aPos !== bPos) return aPos - bPos;

                return a.name.localeCompare(b.name);
            });
        }
    },

    async mounted() {
        await this.loadData();
    },

    methods: {
        async loadData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadClasses(),
                    this.loadParliamentMembers()
                ]);
            } catch (error) {
                console.error('Data load error:', error);
                // i18n notify
                // @ts-ignore
                this.$notify(this.$t('error_loading_data'));
            } finally {
                this.loading = false;
            }
        },

        async loadClasses() {
            const database = new Databases(appw);
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
            } catch (error) {
                console.error('Classes load error:', error);
                this.classes = [];
            }
        },

        async loadParliamentMembers() {
            const database = new Databases(appw);
            try {
                const response = await database.listDocuments(
                    config.website_db,
                    config.parliament_members,
                    [Query.limit(200)]
                );

                this.parliamentMembers = response.documents.map((doc: any) => ({
                    id: doc.$id,
                    name: doc.member_name || '',
                    is_president: doc.is_president || false,
                    position: doc.position || 'member',
                    description: doc.description || '',
                    classList: doc.classList
                }));
            } catch (error) {
                console.error('Members load error:', error);
                this.parliamentMembers = [];
            }
        },

        getClassNameById(year: number, designation: number): string {
            const yearMap: { [key: number]: string } = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
            return `${yearMap[year] || year}-${designation}`;
        },

        getClassName(member: ParliamentMember): string {
            if (member.classList && member.classList.$id) {
                const classData = this.classes.find(c => c.id === member.classList.$id);
                return classData ? classData.name : this.$t('unknown') as string;
            }
            return this.$t('unknown') as string;
        },

        getRoleTitle(member: ParliamentMember): string {
            // Prefer i18n keys instead of inline dictionaries
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
