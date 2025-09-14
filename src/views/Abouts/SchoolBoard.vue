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
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <h1 class="text-4xl font-bold text-white tracking-tight">{{ $t('school_board') }}</h1>
                    </div>
                    <p class="text-blue-100 text-lg mb-6 leading-relaxed">
                        {{ $t('sb_subtitle') }}
                    </p>
                    <div class="flex gap-4">
                        <button 
                            v-if="admin"
                            @click="showEditor = true"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                        >
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                           {{ $t("add_a_member") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Debug Info -->
        <div v-if="debugMode" class="container mx-auto px-6 py-4">
            <div class="bg-gray-100 rounded-lg p-4 text-sm">
                <h3 class="font-bold mb-2">Debug Info:</h3>
                <p><strong>Loading:</strong> {{ loading }}</p>
                <p><strong>Members count:</strong> {{ boardMembers.length }}</p>
                <p><strong>Current locale:</strong> {{ currentLocale }}</p>
                <p><strong>Admin:</strong> {{ admin }}</p>
                <div v-if="boardMembers.length > 0">
                    <p><strong>First member:</strong></p>
                    <pre>{{ JSON.stringify(boardMembers[0], null, 2) }}</pre>
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

            <!-- Error State -->
            <div v-if="error" class="text-center py-20">
                <div class="max-w-md mx-auto">
                    <div class="text-red-400 mb-6">
                        <svg class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t("error") }}</h3>
                    <p class="text-gray-600 mb-4">{{ error }}</p>
                    <button 
                        @click="loadData"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                    >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        {{ $t("retry") }}
                    </button>
                </div>
            </div>

            <!-- School Board Members Table -->
            <div v-if="!loading && !error && sortedMembers.length > 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Table Header -->
                <div class="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white px-6 py-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-white/10 rounded-lg">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold">{{ $t('school_board') }}</h3>
                                <p class="text-gray-300 text-sm">{{ sortedMembers.length }} {{ $t("member") }}</p>
                            </div>
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
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t('role') }}</th>
                                <th v-if="admin" class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t("operations") }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr 
                                v-for="(member, index) in sortedMembers" 
                                :key="member.$id || member.id"
                                class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                            >
                                <!-- Number -->
                                <td class="px-6 py-4">
                                    <div 
                                        class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm"
                                    >
                                        {{ index + 1 }}
                                    </div>
                                </td>
                                
                                <!-- Name -->
                                <td class="px-6 py-4">
                                    <div class="text-base font-semibold text-gray-900">
                                        {{ getDisplayName(member) }}
                                    </div>
                                </td>
                                
                                <!-- Role -->
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-300">
                                        {{ getDisplayRole(member) }}
                                    </span>
                                </td>

                                <!-- Actions -->
                                <td v-if="admin" class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button 
                                            @click="editMember(member)"
                                            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                            title="Szerkesztés"
                                        >
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </button>
                                        <button 
                                            @click="deleteMember(member)"
                                            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                            title="Törlés"
                                        >
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </div>
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
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('no_board_members_found') }}</h3>
                    <p class="text-gray-600 mb-6">{{ $t("no_board_members_paragraph") }}</p>
                    <div v-if="admin" class="flex gap-4 justify-center">
                        <button 
                            @click="showEditor = true"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            {{ $t("add_a_member") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Member Editor Modal -->
        <div v-if="showEditor && admin" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-bold">
                            {{ editingMember ? 'Tag szerkesztése' : 'Új tag hozzáadása' }}
                        </h3>
                        <button 
                            @click="closeEditor"
                            class="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                        >
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Modal Content -->
                <form @submit.prevent="saveMember" class="p-6 space-y-6">
                    <!-- Name Fields -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Név (Magyar) *</label>
                            <input 
                                v-model="memberForm.name_hu"
                                type="text" 
                                required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Teljes név magyarul"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Név (Szerb)</label>
                            <input 
                                v-model="memberForm.name_rs"
                                type="text" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Teljes név szerbül"
                            >
                        </div>
                    </div>

                    <!-- Role -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Szerep/Pozíció *</label>
                        <input 
                            v-model="memberForm.role"
                            type="text" 
                            required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="pl. Igazgató, Igazgatóhelyettes, Tanár, stb."
                        >
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex gap-3 justify-end pt-4 border-t">
                        <button 
                            type="button"
                            @click="closeEditor"
                            class="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                        >
                            {{ $t("cancel") }}
                        </button>
                        <button 
                            type="submit"
                            :disabled="saving || !memberForm.name_hu.trim() || !memberForm.role.trim()"
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ saving ? 'Mentés...' : (editingMember ? 'Frissítés' : 'Hozzáadás') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteConfirm && admin" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="p-3 bg-red-100 rounded-full">
                            <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">Tag törlése</h3>
                            <p class="text-gray-600">Biztosan törölni szeretnéd ezt a tagot?</p>
                        </div>
                    </div>
                    <div v-if="memberToDelete" class="bg-gray-50 rounded-lg p-4 mb-6">
                        <p class="font-semibold">{{ getDisplayName(memberToDelete) }}</p>
                        <p class="text-sm text-gray-600">{{ getDisplayRole(memberToDelete) }}</p>
                    </div>
                    <div class="flex gap-3 justify-end">
                        <button 
                            @click="showDeleteConfirm = false"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            Mégse
                        </button>
                        <button 
                            @click="confirmDelete"
                            :disabled="deleting"
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ deleting ? 'Törlés...' : 'Törlés' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Client, Databases, Query, ID } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";

interface BoardMember {
    $id?: string;
    id?: string;
    name_hu: string;
    name_rs: string;
    role: string;
}

export default {
    name: 'SchoolBoard',
    
    data() {
        return {
            loading: true,
            error: null as string | null,
            debugMode: false,
            boardMembers: [] as BoardMember[],
            currentLocale: 'hu',
            showEditor: false,
            editingMember: null as BoardMember | null,
            saving: false,
            deleting: false,
            showDeleteConfirm: false,
            memberToDelete: null as BoardMember | null,
            memberForm: {
                name_hu: '',
                name_rs: '',
                role: ''
            }
        }
    },

    computed: {
        admin(): boolean {
            const cc = useLoadingStore();
            return cc.userLoggedin;
        },

        sortedMembers(): BoardMember[] {
            if (!this.boardMembers.length) return [];
            
            return [...this.boardMembers].sort((a, b) => {
                // Sort by role importance first (you can customize this order)
                const roleOrder = ['igazgató', 'igazgatóhelyettes', 'tanár', 'titkár'];
                const aRoleIndex = roleOrder.findIndex(role => a.role.toLowerCase().includes(role));
                const bRoleIndex = roleOrder.findIndex(role => b.role.toLowerCase().includes(role));
                
                if (aRoleIndex !== -1 && bRoleIndex !== -1) {
                    if (aRoleIndex !== bRoleIndex) return aRoleIndex - bRoleIndex;
                } else if (aRoleIndex !== -1) {
                    return -1;
                } else if (bRoleIndex !== -1) {
                    return 1;
                }

                // Then by name
                const aName = this.getDisplayName(a);
                const bName = this.getDisplayName(b);
                return aName.localeCompare(bName);
            });
        }
    },

    async mounted() {
        this.currentLocale = this.$i18n?.locale || 'hu';
        await this.loadData();
        
        // Debug mode toggle with Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.debugMode = !this.debugMode;
            }
        });
    },

    methods: {
        async loadData() {
            this.loading = true;
            this.error = null;
            
            try {
                await this.loadBoardMembers();
            } catch (error: any) {
                console.error('Data load error:', error);
                this.error = error.message || 'Hiba az adatok betöltésében';
            } finally {
                this.loading = false;
            }
        },

        async loadBoardMembers() {
            if (!config.school_board) {
                throw new Error('School board collection ID not configured');
            }

            const database = new Databases(appw);
            try {
                const response = await database.listDocuments(
                    config.website_db,
                    config.school_board,
                    [Query.limit(200), Query.orderAsc('$createdAt')]
                );

                console.log('Raw school board data:', response.documents);

                this.boardMembers = response.documents.map((doc: any) => ({
                    $id: doc.$id,
                    id: doc.$id,
                    name_hu: doc.name_hu || '',
                    name_rs: doc.name_rs || '',
                    role: doc.role || ''
                }));

                console.log('Processed board members:', this.boardMembers);
                
            } catch (error: any) {
                console.error('Board members load error:', error);
                throw new Error(`Iskolaszék tagok betöltési hiba: ${error.message}`);
            }
        },

        getDisplayName(member: BoardMember): string {
            const cc = useLoadingStore();
            if (cc.language == "sr" || cc.language == "rs") {
                return member.name_rs || member.name_hu || 'Névtelen';
            } else {
                return member.name_hu || member.name_rs || 'Névtelen';
            }
        },

        getDisplayRole(member: BoardMember): string {
            return member.role || 'Nincs megadva';
        },

        editMember(member: BoardMember) {
            if (!this.admin) return;
            
            this.editingMember = member;
            this.memberForm = {
                name_hu: member.name_hu,
                name_rs: member.name_rs,
                role: member.role
            };
            this.showEditor = true;
        },

        deleteMember(member: BoardMember) {
            if (!this.admin) return;
            
            this.memberToDelete = member;
            this.showDeleteConfirm = true;
        },

        async confirmDelete() {
            if (!this.memberToDelete || !this.admin) return;
            
            this.deleting = true;
            try {
                const database = new Databases(appw);
                await database.deleteDocument(
                    config.website_db,
                    config.school_board,
                    this.memberToDelete.$id!
                );
                
                // Remove from local array
                this.boardMembers = this.boardMembers.filter(m => m.$id !== this.memberToDelete!.$id);
                
                this.showDeleteConfirm = false;
                this.memberToDelete = null;
            } catch (error: any) {
                console.error('Delete error:', error);
                this.error = `Törlési hiba: ${error.message}`;
            } finally {
                this.deleting = false;
            }
        },

        closeEditor() {
            this.showEditor = false;
            this.editingMember = null;
            this.memberForm = {
                name_hu: '',
                name_rs: '',
                role: ''
            };
        },

        async saveMember() {
            if (!this.admin || !this.memberForm.name_hu.trim() || !this.memberForm.role.trim()) return;
            
            this.saving = true;
            try {
                const database = new Databases(appw);
                
                const memberData = {
                    name_hu: this.memberForm.name_hu.trim(),
                    name_rs: this.memberForm.name_rs.trim(),
                    role: this.memberForm.role.trim()
                };

                if (this.editingMember) {
                    // Update existing member
                    const updatedDoc = await database.updateDocument(
                        config.website_db,
                        config.school_board,
                        this.editingMember.$id!,
                        memberData
                    );
                    
                    // Update local array
                    const index = this.boardMembers.findIndex(m => m.$id === this.editingMember!.$id);
                    if (index !== -1) {
                        this.boardMembers[index] = {
                            ...memberData,
                            $id: updatedDoc.$id,
                            id: updatedDoc.$id
                        };
                    }
                } else {
                    // Create new member
                    const newDoc = await database.createDocument(
                        config.website_db,
                        config.school_board,
                        ID.unique(),
                        memberData
                    );
                    
                    // Add to local array
                    this.boardMembers.push({
                        ...memberData,
                        $id: newDoc.$id,
                        id: newDoc.$id
                    });
                }
                
                this.closeEditor();
            } catch (error: any) {
                console.error('Save error:', error);
                this.error = `Mentési hiba: ${error.message}`;
            } finally {
                this.saving = false;
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

.bg-white { 
    animation: fadeInUp 0.6s ease-out forwards; 
}

/* Modal backdrop animation */
.fixed {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Modal content animation */
.fixed > div {
    animation: slideUp 0.4s ease-out forwards;
}

@keyframes slideUp {
    from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.95); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
}

/* Form validation styles */
input:invalid, select:invalid, textarea:invalid {
    border-color: #ef4444;
}

input:valid, select:valid, textarea:valid {
    border-color: #3b82f6;
}

/* Loading spinner */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* Responsive table */
@media (max-width: 640px) {
    .overflow-x-auto {
        -webkit-overflow-scrolling: touch;
    }
    
    table {
        min-width: 600px;
    }
}
</style>