<template>
    <div v-if="!loading" class="relative mb-4 container px-5 mx-auto bg-white">
        <div>
            <v-btn @click="delete_content" class="m-5">{{ $t('delete') }}</v-btn>
            <VBtn @click="$router.go(-1)" class="m-5">{{ $t("goback") }}</VBtn>
        </div>

        <div>
            <!-- Osztály adatok -->
            <div>
                <v-select
                    :items="syears"
                    v-model="year"
                    :label="$t('year')"
                    item-value="id"
                    item-text="title"
                    @update:modelValue="save"
                ></v-select>
            </div>
            
            <div>
                <v-select
                    :items="sdelegation"
                    v-model="delegation"
                    :label="$t('class_number')"
                    @update:modelValue="save"
                ></v-select>
            </div>
            
            <div>
                <v-autocomplete
                    :items="workers"
                    v-model="masterchief"
                    :label="$t('masterchief')"
                    item-value="id"
                    item-text="title"
                    @update:modelValue="save"
                ></v-autocomplete>
            </div>

            <div>
                <v-select
                    :items="courses"
                    v-model="course"
                    :label="$t('school_profiles')"
                    item-value="id"
                    item-text="title"
                    @update:modelValue="save"
                ></v-select>
            </div>

            <div>
                <v-select
                    :items="languages"
                    v-model="language"
                    :label="$t('language')"
                    item-value="id"
                    item-text="title"
                    @update:modelValue="save"
                ></v-select>
            </div>

            <!-- Fogadóóra beállítások -->
            <div class="mt-6">
                <h3 class="text-lg font-medium mb-4">{{ $t('receiving_hours_settings') }}</h3>
                
                <v-card class="mb-4">
                    <v-card-title>{{ $t('class_receiving_hour') }}</v-card-title>
                    <v-card-text>
                        <div v-for="(schedule, index) in receiving_schedules" :key="'schedule_' + index" class="mb-3 p-3 border rounded">
                            <div class="flex gap-4 items-center flex-wrap">
                                <v-select
                                    v-model="schedule.day"
                                    :items="dayOptions"
                                    :label="$t('day')"
                                    item-title="label"
                                    item-value="value"
                                    @update:model-value="save"
                                    style="min-width: 150px;"
                                ></v-select>
                                
                                <v-select
                                    v-model="schedule.period"
                                    :items="periodOptions"
                                    :label="$t('lesson_period')"
                                    item-title="label"
                                    item-value="value"
                                    @update:model-value="save"
                                    style="min-width: 200px;"
                                ></v-select>
                                
                                <v-text-field
                                    v-model="schedule.location"
                                    :label="$t('location')"
                                    @change="save"
                                    style="min-width: 120px;"
                                ></v-text-field>
                                
                                <v-btn 
                                    icon="mdi-delete" 
                                    color="error" 
                                    size="small"
                                    @click="removeSchedule(index)"
                                ></v-btn>
                            </div>
                        </div>
                        <v-btn @click="addSchedule" color="primary" size="small">
                            <v-icon>mdi-plus</v-icon>
                            {{ $t('add_schedule') }}
                        </v-btn>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Elválasztó vonal -->
            <v-divider class="my-6"></v-divider>
            <h3 class="mb-4">{{ $t('parliament_members') }}</h3>

            <!-- Parlament tag hozzáadása/szerkesztése -->
            <v-card class="mb-4">
                <v-card-title>{{ editing_member_id ? $t('edit_parliament_member') : $t('add_parliament_member') }}</v-card-title>
                <v-card-text>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <v-text-field
                            v-model="parliament_member_name_hu"
                            :counter="100"
                            :label="$t('parliament_member_name_hu')"
                            required
                            :rules="nameRules"
                        ></v-text-field>

                        <v-text-field
                            v-model="parliament_member_name_rs"
                            :counter="100"
                            :label="$t('parliament_member_name_rs')"
                            :rules="nameRulesOptional"
                        ></v-text-field>

                        <v-select
                            :items="parliament_positions"
                            v-model="parliament_position"
                            :label="$t('parliament_position')"
                            item-value="id"
                            item-text="title"
                        ></v-select>

                        <div class="flex items-center">
                            <v-checkbox
                                v-model="is_president"
                                :label="$t('is_parliament_president')"
                            ></v-checkbox>
                        </div>
                    </div>

                    <div class="mt-4">
                        <v-textarea
                            v-model="parliament_description_hu"
                            :counter="500"
                            :label="$t('parliament_description_hu')"
                            rows="3"
                        ></v-textarea>
                    </div>

                    <div class="mt-4">
                        <v-textarea
                            v-model="parliament_description_rs"
                            :counter="500"
                            :label="$t('parliament_description_rs')"
                            rows="3"
                        ></v-textarea>
                    </div>

                    <div class="flex gap-2 mt-4">
                        <v-btn 
                            @click="addParliamentMember" 
                            color="primary"
                            :disabled="!parliament_member_name_hu?.trim()"
                        >
                            {{ editing_member_id ? $t('update_member') : $t('add_parliament_member') }}
                        </v-btn>
                        
                        <v-btn 
                            v-if="editing_member_id"
                            @click="clearParliamentForm" 
                            color="secondary"
                        >
                            {{ $t('cancel') }}
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>

            <!-- Meglévő parlament tagok listája -->
            <v-card v-if="parliament_members && parliament_members.length > 0">
                <v-card-title>{{ $t('current_parliament_members') }}</v-card-title>
                <v-list>
                    <v-list-item
                        v-for="member in parliament_members"
                        :key="member.id"
                    >
                        <v-list-item-content>
                            <v-list-item-title>
                                {{ getDisplayName(member) }}
                                <v-chip 
                                    v-if="member.is_president" 
                                    color="primary" 
                                    small
                                    class="ml-2"
                                >
                                    {{ $t('president') }}
                                </v-chip>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                {{ member.position }} 
                                <span v-if="getDisplayDescription(member)"> - {{ getDisplayDescription(member) }}</span>
                            </v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action>
                            <div class="flex gap-2">
                                <v-btn 
                                    @click="editParliamentMember(member)"
                                    icon="mdi-pencil"
                                    size="small"
                                    color="primary"
                                ></v-btn>
                                <v-btn 
                                    @click="deleteParliamentMember(member.id)"
                                    icon="mdi-delete"
                                    size="small"
                                    color="error"
                                ></v-btn>
                            </div>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </v-card>

            <!-- Üzenet, ha nincs parlament tag -->
            <v-card v-else-if="!loading">
                <v-card-text class="text-center text-gray-500">
                    {{ $t('no_parliament_members_found') }}
                </v-card-text>
            </v-card>
        </div>
    </div>    
</template>

<script lang="ts">
import { Client, Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";
import { convertifserbian } from "@/lang";

interface Schedule {
    day: string;
    period: string;
    location: string;
}

interface ParliamentMember {
    id: string;
    name_hu: string;
    name_rs: string;
    is_president: boolean;
    position: string;
    description_hu: string;
    description_rs: string;
}

export default {
    data() {
        return {
            // Eredeti osztály adatok
            year: 1,
            syears: [
                { id: 1, title: "I" },
                { id: 2, title: "II" },
                { id: 3, title: "III" },
                { id: 4, title: "IV" },
            ],
            sdelegation: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            delegation: null,
            courses: [],
            course: "",
            workers: [{ id: "a", title: "test" }],
            masterchief: "",
            loading: true,
            language: "",
            languages: [
                { id: "class_hun", title: this.$t('hun_teaching') },
                { id: "class_srb", title: this.$t('srb_teaching') }
            ],

            // Fogadóóra időpontok
            receiving_schedules: [] as Schedule[],

            // Parlament tagok
            parliament_members: [] as ParliamentMember[],
            parliament_member_name_hu: "",
            parliament_member_name_rs: "",
            is_president: false,
            parliament_position: "member",
            parliament_description_hu: "",
            parliament_description_rs: "",
            editing_member_id: null,
            
            parliament_positions: [
                { id: "president", title: "Elnök" },
                { id: "vice_president", title: "Alelnök" },
                { id: "secretary", title: "Titkár" },
                { id: "treasurer", title: "Pénztáros" },
                { id: "member", title: "Tag" }
            ],

            nameRules: [
                (v: string) => !!v || 'Magyar név megadása kötelező',
                (v: string) => (v && v.length <= 100) || 'Név maximum 100 karakter lehet',
            ],

            nameRulesOptional: [
                (v: string) => !v || v.length <= 100 || 'Név maximum 100 karakter lehet',
            ],

            dayOptions: [
                { label: 'Hétfő', value: 'monday' },
                { label: 'Kedd', value: 'tuesday' },
                { label: 'Szerda', value: 'wednesday' },
                { label: 'Csütörtök', value: 'thursday' },
                { label: 'Péntek', value: 'friday' }
            ],
            periodOptions: [
                { label: '1. óra (6:40-7:25)', value: 'period_1' },
                { label: '2. óra (7:30-8:15)', value: 'period_2' },
                { label: '3. óra (8:20-9:05)', value: 'period_3' },
                { label: '4. óra (9:20-10:05)', value: 'period_4' },
                { label: '5. óra (10:10-10:55)', value: 'period_5' },
                { label: '6. óra (11:00-11:40)', value: 'period_6' },
                { label: '7. óra (11:45-12:25)', value: 'period_7' },
                { label: '8. óra (12:30-13:10)', value: 'period_8' },
                { label: '1. délutáni óra (13:15-14:00)', value: 'afternoon_1' },
                { label: '2. délutáni óra (14:05-14:50)', value: 'afternoon_2' },
                { label: '3. délutáni óra (14:55-15:40)', value: 'afternoon_3' },
                { label: '4. délutáni óra (15:55-16:35)', value: 'afternoon_4' },
                { label: '5. délutáni óra (16:40-17:20)', value: 'afternoon_5' },
                { label: '6. délutáni óra (17:25-18:05)', value: 'afternoon_6' },
                { label: '7. délutáni óra (18:10-18:50)', value: 'afternoon_7' },
                { label: '8. délutáni óra (18:55-19:35)', value: 'afternoon_8' }
            ]
        }
    },

    computed: {
        currentLanguage() {
            const cc = useLoadingStore();
            return cc.language;
        }
    },
    
    async mounted() {
        await this.initializeComponent();
    },

    methods: {
        async initializeComponent() {
            try {
                this.initializeTimeOptions();
                await this.getMD();
                await this.getParliamentPositions();
                await this.getParliamentMembers();
            } catch (error) {
                console.error('Inicializálási hiba:', error);
                this.$notify('Hiba történt az adatok betöltésekor');
            } finally {
                this.loading = false;
            }
        },

        initializeTimeOptions() {
            const cc = useLoadingStore();
            const lang = cc.language;
            
            if (lang === 'hu') {
                this.dayOptions = [
                    { label: 'Hétfő', value: 'monday' },
                    { label: 'Kedd', value: 'tuesday' },
                    { label: 'Szerda', value: 'wednesday' },
                    { label: 'Csütörtök', value: 'thursday' },
                    { label: 'Péntek', value: 'friday' }
                ];
                this.parliament_positions = [
                    { id: "president", title: "Elnök" },
                    { id: "vice_president", title: "Alelnök" },
                    { id: "secretary", title: "Titkár" },
                    { id: "treasurer", title: "Pénztáros" },
                    { id: "member", title: "Tag" }
                ];
            } else if (lang === 'rs' || lang === 'sr') {
                this.dayOptions = [
                    { label: 'Понедељак', value: 'monday' },
                    { label: 'Уторак', value: 'tuesday' },
                    { label: 'Среда', value: 'wednesday' },
                    { label: 'Четвртак', value: 'thursday' },
                    { label: 'Петак', value: 'friday' }
                ];
                this.parliament_positions = [
                    { id: "president", title: "Председник" },
                    { id: "vice_president", title: "Потпредседник" },
                    { id: "secretary", title: "Секретар" },
                    { id: "treasurer", title: "Благајник" },
                    { id: "member", title: "Члан" }
                ];
            } else {
                this.dayOptions = [
                    { label: 'Monday', value: 'monday' },
                    { label: 'Tuesday', value: 'tuesday' },
                    { label: 'Wednesday', value: 'wednesday' },
                    { label: 'Thursday', value: 'thursday' },
                    { label: 'Friday', value: 'friday' }
                ];
                this.parliament_positions = [
                    { id: "president", title: "President" },
                    { id: "vice_president", title: "Vice President" },
                    { id: "secretary", title: "Secretary" },
                    { id: "treasurer", title: "Treasurer" },
                    { id: "member", title: "Member" }
                ];
            }
        },

        addSchedule() {
            this.receiving_schedules.push({
                day: 'monday',
                period: 'period_1',
                location: ''
            });
            this.save();
        },
        
        removeSchedule(index: number) {
            this.receiving_schedules.splice(index, 1);
            this.save();
        },

        async getMD() {
            const database = new Databases(appw);
            const cc = useLoadingStore();
            
            try {
                // Workers betöltése
                let k = await database.listDocuments(config.website_db, config.workers, [Query.limit(150)]);
                this.workers = [];

                for (let index = 0; index < k.total; index++) {
                    const element = k.documents[index];
                    let a = { title: "", id: "" };
                    try {
                        a.title = element.worker_name_hu;
                        if (cc.language == "sr" || cc.language == "rs") {
                            a.title = convertifserbian(element.worker_name_rs);
                        }
                        a.id = element.$id;
                        this.workers.push(a);
                    } catch (ex) {
                        console.log('Worker feldolgozási hiba:', ex);
                    }
                }
                
                // Courses betöltése
                this.courses = [];
                k = await database.listDocuments(config.website_db, config.courselist, [Query.limit(150)]);
                for (let index = 0; index < k.total; index++) {
                    const element = k.documents[index];
                    let a = { title: "", id: "" };
                    a.id = element.$id;
                    if (cc.language == "rs" || cc.language == "sr") {
                        a.title = convertifserbian(element.title_rs);
                    } else if (cc.language == "hu") {
                        a.title = element.title_hu;
                    } else if (cc.language == "en") {
                        a.title = element.title_en;
                    }
                    this.courses.push(a);
                }
                
                // Osztály adatok betöltése
                k = await database.getDocument(config.website_db, config.classlist, this.$route.params.id);
                
                this.year = k.year || 1;
                this.delegation = k.designation;
                
                try {
                    this.masterchief = k.workers?.$id || "";
                } catch (ex) {
                    console.log('Masterchief hiba:', ex);
                }
                
                try {
                    this.course = k.courses?.$id || "";
                } catch (ex) {
                    console.log('Course hiba:', ex);
                }
                
                this.language = k.language || "";
                
                // Fogadóórák betöltése
                try {
                    if (k.receiving_schedules && typeof k.receiving_schedules === 'string') {
                        this.receiving_schedules = JSON.parse(k.receiving_schedules);
                    } else if (Array.isArray(k.receiving_schedules)) {
                        this.receiving_schedules = k.receiving_schedules;
                    } else {
                        this.receiving_schedules = [];
                    }
                } catch (e) {
                    console.log('Receiving schedules parsing hiba:', e);
                    this.receiving_schedules = [];
                }
            } catch (error) {
                console.error('getMD hiba:', error);
                throw error;
            }
        },

        async save() {
            try {
                const database = new Databases(appw);
                
                const updateData: any = {
                    "year": this.year,
                    "designation": this.delegation,
                    "language": this.language,
                    "receiving_schedules": JSON.stringify(this.receiving_schedules)
                };

                // Csak akkor adjuk hozzá, ha van érték
                if (this.masterchief) {
                    updateData.workers = this.masterchief;
                }
                if (this.course) {
                    updateData.courses = this.course;
                }

                const result = await database.updateDocument(
                    config.website_db,
                    config.classlist,
                    this.$route.params.id,
                    updateData
                );
                
                this.$notify(this.$t('saved'));
            } catch (error) {
                console.error('Mentési hiba:', error);
                this.$notify('Hiba történt a mentés során');
            }
        },
        
        async delete_content() {
            if (!confirm(this.$t('confirm_delete'))) return;
            
            try {
                const database = new Databases(appw);
                await database.deleteDocument(config.website_db, config.classlist, this.$route.params.id);  
                this.$notify(this.$t('deleted'));
                this.$router.push("/about/classlist");
            } catch (error) {
                console.error('Törlési hiba:', error);
                this.$notify('Hiba történt a törlés során');
            }
        },

        async getParliamentPositions() {
            // Ez a függvény betöltené a parlament pozíciókat az adatbázisból, ha szükséges
            // Most a statikus lista marad
        },

        async getParliamentMembers() {
            if (!this.$route.params.id) return;
            
            const database = new Databases(appw);
            try {
                let k = await database.listDocuments(config.website_db, config.parliament_members, [
                    Query.equal("classList", this.$route.params.id),
                    Query.limit(150)
                ]);
                
                this.parliament_members = k.documents.map(doc => ({
                    id: doc.$id,
                    name_hu: doc.parliament_member_name_hu || "",  // Javított név
                    name_rs: doc.parliament_member_name_rs || "",  // Javított név
                    is_president: doc.is_president || false,
                    position: this.getPositionTitle(doc.position) || "Tag",
                    description_hu: doc.parliament_description_hu || "",  // Javított név
                    description_rs: doc.parliament_description_rs || ""   // Javított név
                }));
            } catch (ex) {
                console.error('Parliament members betöltési hiba:', ex);
                this.parliament_members = [];
            }
        },

        getPositionTitle(positionId: string): string {
            const position = this.parliament_positions.find(p => p.id === positionId);
            return position ? position.title : positionId;
        },

        getDisplayName(member: ParliamentMember): string {
            const cc = useLoadingStore();
            if (cc.language === 'rs' || cc.language === 'sr') {
                return member.name_rs ? convertifserbian(member.name_rs) : member.name_hu;
            }
            return member.name_hu;
        },

        getDisplayDescription(member: ParliamentMember): string {
            const cc = useLoadingStore();
            if (cc.language === 'rs' || cc.language === 'sr') {
                return member.description_rs ? convertifserbian(member.description_rs) : member.description_hu;
            }
            return member.description_hu;
        },

        async addParliamentMember() {
            if (!this.parliament_member_name_hu?.trim()) {
                this.$notify('Kérem, adja meg a tag magyar nevét');
                return;
            }

            const database = new Databases(appw);
            
            try {
                const documentData = {
                    // Javított attribútum nevek, hogy illeszkedjenek az adatbázis sémához:
                    "parliament_member_name_hu": this.parliament_member_name_hu.trim(),
                    "parliament_member_name_rs": this.parliament_member_name_rs?.trim() || "",
                    "is_president": this.is_president,
                    "position": this.parliament_position || "member",
                    "parliament_description_hu": this.parliament_description_hu?.trim() || "",
                    "parliament_description_rs": this.parliament_description_rs?.trim() || "",
                    "classList": this.$route.params.id
                };

                if (this.editing_member_id) {
                    // Szerkesztés
                    await database.updateDocument(
                        config.website_db,
                        config.parliament_members,
                        this.editing_member_id,
                        documentData
                    );
                    this.editing_member_id = null;
                    this.$notify('Tag sikeresen frissítve');
                } else {
                    // Új hozzáadás
                    await database.createDocument(
                        config.website_db,
                        config.parliament_members,
                        ID.unique(),
                        documentData
                    );
                    this.$notify('Tag sikeresen hozzáadva');
                }
                
                this.clearParliamentForm();
                await this.getParliamentMembers();
                
            } catch (ex) {
                console.error('Parliament member mentési hiba:', ex);
                this.$notify('Hiba történt a tag mentésekor');
            }
        },

        editParliamentMember(member: ParliamentMember) {
            this.parliament_member_name_hu = member.name_hu;
            this.parliament_member_name_rs = member.name_rs;
            this.is_president = member.is_president;
            // A position ID-t keressük meg
            const position = this.parliament_positions.find(p => p.title === member.position);
            this.parliament_position = position ? position.id : "member";
            this.parliament_description_hu = member.description_hu;
            this.parliament_description_rs = member.description_rs;
            this.editing_member_id = member.id;
        },

        async deleteParliamentMember(memberId: string) {
            if (!confirm('Biztosan törli ezt a parlament tagot?')) return;
            
            const database = new Databases(appw);
            
            try {
                await database.deleteDocument(config.website_db, config.parliament_members, memberId);
                await this.getParliamentMembers();
                this.$notify('Tag sikeresen törölve');
            } catch (ex) {
                console.error('Parliament member törlési hiba:', ex);
                this.$notify('Hiba történt a tag törlésekor');
            }
        },

        clearParliamentForm() {
            this.parliament_member_name_hu = "";
            this.parliament_member_name_rs = "";
            this.is_president = false;
            this.parliament_position = "member";
            this.parliament_description_hu = "";
            this.parliament_description_rs = "";
            this.editing_member_id = null;
        }
    }
}
</script>