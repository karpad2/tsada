<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
        <!-- Hero Header -->
        <div class="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 overflow-hidden">
            <div class="absolute inset-0 bg-black/20"></div>
            <!-- Background decoration -->
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div class="relative container mx-auto px-6 py-12">
                <div class="max-w-4xl">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-3 bg-white/10 backdrop-blur-sm rounded-xl ">
                            <svg v-if="false" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                            </svg>
                            <div class="w-12 h-12 flex items-center justify-center">
                                <i class="pi pi-users text-[5rem]"></i>

</div>
                            
                        </div>
                        <h1 class="text-4xl font-bold text-white tracking-tight">{{ $t('parents_council') }}</h1>
                    </div>
                    <p class="text-emerald-100 text-lg mb-6 leading-relaxed">
                        {{ $t('pc_subtitle') }}
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
                <p><strong>Members count:</strong> {{ councilMembers.length }}</p>
                <p><strong>Current locale:</strong> {{ currentLocale }}</p>
                <p><strong>Admin:</strong> {{ admin }}</p>
                <div v-if="councilMembers.length > 0">
                    <p><strong>First member:</strong></p>
                    <pre>{{ JSON.stringify(councilMembers[0], null, 2) }}</pre>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-6 py-8">
            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-20">
                <div class="relative">
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent absolute top-0 left-0"></div>
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
                        class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors duration-200"
                    >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        {{ $t("retry") }}
                    </button>
                </div>
            </div>

            <!-- Parent Council Members Table -->
            <div v-if="!loading && !error && sortedMembers.length > 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Table Header -->
                <div class="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white px-6 py-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-white/10 rounded-lg">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold">{{ $t('parents_council') }}</h3>
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
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t('other_info') }}</th>
                                <th v-if="admin" class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ $t("operations") }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr 
                                v-for="(member, index) in sortedMembers" 
                                :key="member.$id || member.id"
                                class="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200 group"
                            >
                                <!-- Number -->
                                <td class="px-6 py-4">
                                    <div 
                                        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        :class="member.is_president ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'"
                                    >
                                        {{ index + 1 }}
                                    </div>
                                </td>
                                
                                <!-- Name -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="text-base font-semibold text-gray-900">
                                            {{ getDisplayName(member) }}
                                        </div>
                                        <div v-if="member.is_president" class="flex items-center">
                                            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div v-if="getDisplayDescription(member)" class="text-sm text-gray-600 mt-1">
                                        {{ getDisplayDescription(member) }}
                                    </div>
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
                                        {{ $t(member.position) }}
                                    </span>
                                </td>

                                <!-- Contact -->
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-600">
                                        <div v-if="member.email" class="flex items-center gap-1">
                                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                            </svg>
                                            <a :href="`mailto:${member.email}`" class="text-emerald-600 hover:text-emerald-700">{{ member.email }}</a>
                                        </div>
                                        <div v-if="member.phone" class="flex items-center gap-1 mt-1">
                                            <svg  class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                            </svg>
                                            <a :href="`tel:${member.phone}`" class="text-emerald-600 hover:text-emerald-700">{{ member.phone }}</a>
                                        </div>
                                    </div>
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
                        <svg v-if="false" class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('no_council_members_found') }}</h3>
                    <p class="text-gray-600 mb-6">{{ $t("no_council_members_paragraph") }}</p>
                    <div v-if="admin" class="flex gap-4 justify-center">
                        <button 
                            @click="showEditor = true"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors duration-200"
                        >
                            <svg  class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div class="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-t-2xl">
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
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                                placeholder="Teljes név magyarul"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Név (Szerb)</label>
                            <input 
                                v-model="memberForm.name_rs"
                                type="text" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                                placeholder="Teljes név szerbül"
                            >
                        </div>
                    </div>

                    <!-- Role -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Tisztség</label>
                        <select
                            v-model="memberForm.position"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                        >
                            <option value="">-- Válassz tisztséget --</option>
                            <option value="member">{{ $t("member") }}</option>
                            <option value="president">{{ $t("president") }}</option>
                            <option value="vice_president">{{ $t("vicepresident") }}</option>
                            <option value="secretary">Titkár</option>
                            <option value="treasurer">Pénztáros</option>
                            <option value="class_representative_1">1. osztály képviselője</option>
                            <option value="class_representative_2">2. osztály képviselője</option>
                            <option value="class_representative_3">3. osztály képviselője</option>
                            <option value="class_representative_4">4. osztály képviselője</option>
                            <option value="class_representative_5">5. osztály képviselője</option>
                            <option value="class_representative_6">6. osztály képviselője</option>
                            <option value="class_representative_7">7. osztály képviselője</option>
                            <option value="class_representative_8">8. osztály képviselője</option>
                            <option value="class_representative_9">9. osztály képviselője</option>
                            <option value="class_representative_10">10. osztály képviselője</option>
                            <option value="class_representative_11">11. osztály képviselője</option>
                            <option value="class_representative_12">12. osztály képviselője</option>
                        </select>
                    </div>

                    <!-- President checkbox -->
                    <div class="flex items-center gap-3">
                        <input 
                            v-model="memberForm.is_president"
                            type="checkbox" 
                            id="is_president"
                            class="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        >
                        <label for="is_president" class="text-sm font-semibold text-gray-700">Elnök</label>
                    </div>

                   

                    <!-- Description Fields -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Leírás (Magyar)</label>
                            <textarea 
                                v-model="memberForm.description_hu"
                                rows="3"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                                placeholder="Rövid leírás a tagról..."
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Leírás (Szerb)</label>
                            <textarea 
                                v-model="memberForm.description_rs"
                                rows="3"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                                placeholder="Kratki opis o članu..."
                            ></textarea>
                        </div>
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
                            :disabled="saving || !memberForm.name_hu.trim()"
                            class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <p class="text-sm text-gray-600">{{ getRoleTitle(memberToDelete) }}</p>
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

interface CouncilMember {
  $id?: string;
  id?: string;
  is_president: boolean;
  position: string;
  description: string;
  name_hu: string;
  name_rs: string;
  description_hu: string;
  description_rs: string;
  email?: string;
  phone?: string;
}

export default {
  name: "ParentCouncil",

  data() {
    return {
      loading: true,
      error: null as string | null,
      debugMode: false,
      councilMembers: [] as CouncilMember[],
      currentLocale: "hu",
      showEditor: false,
      editingMember: null as CouncilMember | null,
      saving: false,
      deleting: false,
      showDeleteConfirm: false,
      memberToDelete: null as CouncilMember | null,
      memberForm: {
        name_hu: "",
        name_rs: "",
        position: "member",
        is_president: false,
        email: "",
        phone: "",
        description_hu: "",
        description_rs: "",
      },
    };
  },

  computed: {
    admin(): boolean {
      const cc = useLoadingStore();
      return cc.userLoggedin;
    },

    /**
     * Végső, nézet által használt lista:
     * - Speciális szerepek elöl (elnök, alelnök, titkár, pénztáros)
     * - Osztályképviselők évfolyam szerint
     * - Majd II-1/III-4 természetes rendezés (a kijelzett nyelv szerinti description alapján)
     * - Végül név szerint (magyar ékezetekkel)
     */
    sortedMembers(): CouncilMember[] {
      if (!this.councilMembers.length) return [];

      const romanToNumber = (roman: string): number => {
        const map: Record<string, number> = {
          I: 1,
          V: 5,
          X: 10,
          L: 50,
          C: 100,
          D: 500,
          M: 1000,
        };
        let res = 0,
          prev = 0;
        for (let i = roman.length - 1; i >= 0; i--) {
          const v = map[roman[i].toUpperCase()] || 0;
          res += v < prev ? -v : v;
          prev = v;
        }
        return res;
      };

      const parseDesc = (s: string | undefined) => {
        if (!s) return null;
        // Rugalmas minták: "II-1", "III – 4", "IV/2", "I. 3", "II — 1"
        const m = s.match(/^\s*([IVXLCDM]+)\s*[-–—./]?\s*(\d+)\s*$/i);
        if (!m) return null;
        return { rv: romanToNumber(m[1]), n: parseInt(m[2], 10) };
      };

      const getDisplayDesc = (m: CouncilMember) => this.getDisplayDescription(m);

      return [...this.councilMembers].sort((a, b) => {
        // 1) Speciális pozíciók előre
        const isSpecialA = a.is_president || this.isSpecialPosition(a.position);
        const isSpecialB = b.is_president || this.isSpecialPosition(b.position);
        if (isSpecialA && !isSpecialB) return -1;
        if (!isSpecialA && isSpecialB) return 1;

        if (isSpecialA && isSpecialB) {
          // elnök mindig legelöl
          if (a.is_president && !b.is_president) return -1;
          if (!a.is_president && b.is_president) return 1;
          const order = ["president", "vice_president", "secretary", "treasurer"];
          const ai = order.indexOf(a.position || "member");
          const bi = order.indexOf(b.position || "member");
          if (ai !== -1 && bi !== -1 && ai !== bi) return ai - bi;
        }

        // 2) Osztályképviselők: ha position tartalmaz grade-et
        const ag = this.extractGradeFromPosition(a.position);
        const bg = this.extractGradeFromPosition(b.position);
        if (ag && bg && ag !== bg) return ag - bg;
        if (ag && !bg && !isSpecialB) return -1;
        if (bg && !ag && !isSpecialA) return 1;

        // 3) Természetes rendezés a description alapján (II-1 stb.)
        const ap = parseDesc(getDisplayDesc(a));
        const bp = parseDesc(getDisplayDesc(b));
        if (ap && bp) {
          if (ap.rv !== bp.rv) return ap.rv - bp.rv;
          if (ap.n !== bp.n) return ap.n - bp.n;
        } else if (ap && !bp) {
          return -1; // ahol van minta, menjen előrébb
        } else if (!ap && bp) {
          return 1;
        }

        // 4) Végül név szerint
        const aName = this.getDisplayName(a);
        const bName = this.getDisplayName(b);
        return aName.localeCompare(bName, "hu", { sensitivity: "base" });
      });
    },
  },

  async mounted() {
    this.currentLocale = this.$i18n?.locale || "hu";
    await this.loadData();

    // Debug mode toggle: Ctrl+Shift+D
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        this.debugMode = !this.debugMode;
      }
    });
  },

  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;

      try {
        await this.loadCouncilMembers();
      } catch (error: any) {
        console.error("Data load error:", error);
        this.error = error.message || "Hiba az adatok betöltésében";
      } finally {
        this.loading = false;
      }
    },

    async loadCouncilMembers() {
      if (!config.parent_council_members) {
        throw new Error("Parent council members collection ID not configured");
      }

      const database = new Databases(appw);
      try {
        const response = await database.listDocuments(
          config.website_db,
          config.parent_council_members,
          [Query.limit(200)]
        );

        console.log("Raw council data:", response.documents);

        this.councilMembers = response.documents.map((doc: any) => ({
          $id: doc.$id,
          id: doc.$id,
          is_president: Boolean(doc.is_president),
          position: doc.position || "member",
          description: doc.description || "",
          name_hu: doc.name_hu || "",
          name_rs: doc.name_rs || "",
          description_hu: doc.description_hu || "",
          description_rs: doc.description_rs || "",
          email: doc.email || "",
          phone: doc.phone || "",
        }));

        console.log("Processed council members:", this.councilMembers);
      } catch (error: any) {
        console.error("Members load error:", error);
        throw new Error(`Szülői tanács tagok betöltési hiba: ${error.message}`);
      }
    },

    getDisplayName(member: CouncilMember): string {
      const cc = useLoadingStore();
      if (cc.language == "sr" || cc.language == "rs") {
        return member.name_rs || member.name_hu || "Névtelen";
      } else {
        return member.name_hu || member.name_rs || "Névtelen";
      }
    },

    getDisplayDescription(member: CouncilMember): string {
      const cc = useLoadingStore();
      if (cc.language == "sr" || cc.language == "rs") {
        return member.description_rs || member.description_hu || "";
      } else {
        return member.description_hu || member.description_rs || "";
      }
    },

    isSpecialPosition(position: string | undefined): boolean {
      if (!position) return false;
      const specialPositions = [
        "president",
        "vice_president",
        "secretary",
        "treasurer",
      ];
      return specialPositions.includes(position);
    },

    extractGradeFromPosition(position: string | undefined): number | null {
      if (!position) return null;
      const match = position.match(/class_representative_(\d+)/);
      return match ? parseInt(match[1]) : null;
    },

    getRoleTitle(member: CouncilMember): string {
      const cc = useLoadingStore();
      const isSerbian = cc.language == "sr" || cc.language == "rs";

      if (member.position && member.position.startsWith("class_representative_")) {
        const grade = this.extractGradeFromPosition(member.position);
        if (grade) {
          return isSerbian
            ? `Predstavnik ${grade}. razreda`
            : `${grade}. osztály képviselője`;
        }
      }

      const roleMapHu: { [key: string]: string } = {
        president: "Elnök",
        vice_president: "Alelnök",
        secretary: "Titkár",
        treasurer: "Pénztáros",
        member: "Tag",
      };

      const roleMapRs: { [key: string]: string } = {
        president: "Predsednik",
        vice_president: "Potpredsednik",
        secretary: "Sekretar",
        treasurer: "Blagajnik",
        member: "Član",
      };

      const roleMap = isSerbian ? roleMapRs : roleMapHu;
      return roleMap[member.position] || (isSerbian ? "Član" : "Tag");
    },

    getRoleBadgeClass(member: CouncilMember): string {
      if (member.is_president || member.position === "president") {
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-400 shadow-lg";
      }
      switch (member.position) {
        case "vice_president":
          return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-md";
        case "secretary":
          return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-md";
        case "treasurer":
          return "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-md";
        default:
          return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400 shadow-sm";
      }
    },

    editMember(member: CouncilMember) {
      if (!this.admin) return;

      this.editingMember = member;
      this.memberForm = {
        name_hu: member.name_hu,
        name_rs: member.name_rs,
        position: member.position,
        is_president: member.is_president,
        email: member.email || "",
        phone: member.phone || "",
        description_hu: member.description_hu,
        description_rs: member.description_rs,
      };
      this.showEditor = true;
    },

    deleteMember(member: CouncilMember) {
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
          config.parent_council_members,
          this.memberToDelete.$id!
        );

        this.councilMembers = this.councilMembers.filter(
          (m) => m.$id !== this.memberToDelete!.$id
        );

        this.showDeleteConfirm = false;
        this.memberToDelete = null;
      } catch (error: any) {
        console.error("Delete error:", error);
        this.error = `Törlési hiba: ${error.message}`;
      } finally {
        this.deleting = false;
      }
    },

    closeEditor() {
      this.showEditor = false;
      this.editingMember = null;
      this.memberForm = {
        name_hu: "",
        name_rs: "",
        position: "member",
        is_president: false,
        email: "",
        phone: "",
        description_hu: "",
        description_rs: "",
      };
    },

    getClassNameById(year: number, designation: number): string {
      const yearMap: { [key: number]: string } = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      return `${yearMap[year] || year}-${designation}`;
    },

    async saveMember() {
      if (!this.admin || !this.memberForm.name_hu.trim()) return;

      this.saving = true;
      try {
        const database = new Databases(appw);

        const memberData = {
          name_hu: this.memberForm.name_hu.trim(),
          name_rs: this.memberForm.name_rs.trim(),
          position: this.memberForm.position,
          is_president: this.memberForm.is_president,
          email: this.memberForm.email?.trim() || "",
          phone: this.memberForm.phone?.trim() || "",
          description_hu: this.memberForm.description_hu.trim(),
          description_rs: this.memberForm.description_rs.trim(),
        };

        if (this.editingMember) {
          // Update
          const updatedDoc = await database.updateDocument(
            config.website_db,
            config.parent_council_members,
            this.editingMember.$id!,
            memberData
          );

          const index = this.councilMembers.findIndex(
            (m) => m.$id === this.editingMember!.$id
          );
          if (index !== -1) {
            this.councilMembers[index] = {
              ...this.councilMembers[index],
              ...memberData,
              $id: updatedDoc.$id,
              id: updatedDoc.$id,
              description:
                memberData.description_hu || memberData.description_rs || "",
            };
          }
        } else {
          // Create
          const newDoc = await database.createDocument(
            config.website_db,
            config.parent_council_members,
            ID.unique(),
            memberData
          );

          this.councilMembers.push({
            ...memberData,
            $id: newDoc.$id,
            id: newDoc.$id,
            description:
              memberData.description_hu || memberData.description_rs || "",
          });
        }

        this.closeEditor();
      } catch (error: any) {
        console.error("Save error:", error);
        this.error = `Mentési hiba: ${error.message}`;
      } finally {
        this.saving = false;
      }
    },
  },
};
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
    border-color: #10b981;
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