<template>
    <div class="relative mb-4 container px-5 mx-auto bg-white">
        <div>
            <v-btn @click="delete_content" class="m-5">{{ $t('delete') }}</v-btn>
            <v-btn @click="$router.go(-1)" class="m-5">{{ $t("goback") }}</v-btn>
        </div>

        <div>
            <v-file-input @change="file_upload" v-model="file_link" accept="image/*" :label="$t('fileupload')"></v-file-input>
            {{ $t("preview") }}
            <div class="flex flex-wrap -m-4">
                <div class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
                    <div class="bg-slate-100/30 hover:bg-sky-600/30 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                        <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out"
                            v-lazy="img" alt="content">
                    </div>
                </div>
            </div>

            <div>
                <v-text-field
                    @change="save"
                    v-model="worker_name_hu"
                    :counter="100"
                    :label="$t('worker_name_hu')"
                    hide-details
                ></v-text-field>
            </div>
            <div>
                <v-text-field
                    @change="save"
                    v-model="worker_name_rs"
                    :counter="100"
                    :label="$t('worker_name_rs')"
                    hide-details
                ></v-text-field>
            </div>
            <div>
                <v-text-field
                    @change="save"
                    v-model="contact"
                    :counter="100"
                    :label="$t('contact')"
                    hide-details
                ></v-text-field>
            </div>

            <!-- Fogadóóra beállítások -->
            <div class="mt-6">
                <h3 class="text-lg font-medium mb-4">{{ $t('receiving_hours_settings') }}</h3>
                
                <!-- Pedagógus fogadóóra -->
                <v-card class="mb-4">
                    <v-card-title>{{ $t('p_receiving_hour') }}</v-card-title>
                    <v-card-text>
                        <div v-for="(schedule, index) in p_receiving_schedules" :key="'p_' + index" class="mb-3 p-3 border rounded">
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
                                    @click="removePSchedule(index)"
                                ></v-btn>
                            </div>
                        </div>
                        <v-btn @click="addPSchedule" color="primary" size="small">
                            <v-icon>mdi-plus</v-icon>
                            {{ $t('add_schedule') }}
                        </v-btn>
                    </v-card-text>
                </v-card>

                <!-- Ügyfélszolgálati fogadóóra -->
                <v-card class="mb-4">
                    <v-card-title>{{ $t('u_receiving_hour') }}</v-card-title>
                    <v-card-text>
                        <div v-for="(schedule, index) in u_receiving_schedules" :key="'u_' + index" class="mb-3 p-3 border rounded">
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
                                    @click="removeUSchedule(index)"
                                ></v-btn>
                            </div>
                        </div>
                        <v-btn @click="addUSchedule" color="primary" size="small">
                            <v-icon>mdi-plus</v-icon>
                            {{ $t('add_schedule') }}
                        </v-btn>
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </div>    
</template>

<script lang="ts">
import { Client, Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";

interface Schedule {
    day: string;
    period: string;
    location: string;
}

export default {
    data() {
        return {
            worker_name_hu: "",
            worker_name_rs: "",
            contact: "",
            p_receiving_schedules: [] as Schedule[],
            u_receiving_schedules: [] as Schedule[],
            default_img_link: "",
            file_link: null,
            img: "",
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
    mounted() {
        this.initializeOptions();
        this.getMD();
    },
    methods: {
        initializeOptions() {
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
                this.periodOptions = [
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
                ];
            } else if (lang === 'rs' || lang === 'sr') {
                this.dayOptions = [
                    { label: 'Понедељак', value: 'monday' },
                    { label: 'Уторак', value: 'tuesday' },
                    { label: 'Среда', value: 'wednesday' },
                    { label: 'Четвртак', value: 'thursday' },
                    { label: 'Петак', value: 'friday' }
                ];
                this.periodOptions = [
                    { label: '1. час (6:40-7:25)', value: 'period_1' },
                    { label: '2. час (7:30-8:15)', value: 'period_2' },
                    { label: '3. час (8:20-9:05)', value: 'period_3' },
                    { label: '4. час (9:20-10:05)', value: 'period_4' },
                    { label: '5. час (10:10-10:55)', value: 'period_5' },
                    { label: '6. час (11:00-11:40)', value: 'period_6' },
                    { label: '7. час (11:45-12:25)', value: 'period_7' },
                    { label: '8. час (12:30-13:10)', value: 'period_8' },
                    { label: '1. поподневни час (13:15-14:00)', value: 'afternoon_1' },
                    { label: '2. поподневни час (14:05-14:50)', value: 'afternoon_2' },
                    { label: '3. поподневni час (14:55-15:40)', value: 'afternoon_3' },
                    { label: '4. поподневни час (15:55-16:35)', value: 'afternoon_4' },
                    { label: '5. поподневни час (16:40-17:20)', value: 'afternoon_5' },
                    { label: '6. поподневни час (17:25-18:05)', value: 'afternoon_6' },
                    { label: '7. поподневни час (18:10-18:50)', value: 'afternoon_7' },
                    { label: '8. поподневни час (18:55-19:35)', value: 'afternoon_8' }
                ];
            } else {
                this.dayOptions = [
                    { label: 'Monday', value: 'monday' },
                    { label: 'Tuesday', value: 'tuesday' },
                    { label: 'Wednesday', value: 'wednesday' },
                    { label: 'Thursday', value: 'thursday' },
                    { label: 'Friday', value: 'friday' }
                ];
                this.periodOptions = [
                    { label: '1st period (6:40-7:25)', value: 'period_1' },
                    { label: '2nd period (7:30-8:15)', value: 'period_2' },
                    { label: '3rd period (8:20-9:05)', value: 'period_3' },
                    { label: '4th period (9:20-10:05)', value: 'period_4' },
                    { label: '5th period (10:10-10:55)', value: 'period_5' },
                    { label: '6th period (11:00-11:40)', value: 'period_6' },
                    { label: '7th period (11:45-12:25)', value: 'period_7' },
                    { label: '8th period (12:30-13:10)', value: 'period_8' },
                    { label: '1st afternoon period (13:15-14:00)', value: 'afternoon_1' },
                    { label: '2nd afternoon period (14:05-14:50)', value: 'afternoon_2' },
                    { label: '3rd afternoon period (14:55-15:40)', value: 'afternoon_3' },
                    { label: '4th afternoon period (15:55-16:35)', value: 'afternoon_4' },
                    { label: '5th afternoon period (16:40-17:20)', value: 'afternoon_5' },
                    { label: '6th afternoon period (17:25-18:05)', value: 'afternoon_6' },
                    { label: '7th afternoon period (18:10-18:50)', value: 'afternoon_7' },
                    { label: '8th afternoon period (18:55-19:35)', value: 'afternoon_8' }
                ];
            }
        },
        
        addPSchedule() {
            this.p_receiving_schedules.push({
                day: 'monday',
                period: 'period_1',
                location: ''
            });
            this.save();
        },
        
        removePSchedule(index) {
            this.p_receiving_schedules.splice(index, 1);
            this.save();
        },
        
        addUSchedule() {
            this.u_receiving_schedules.push({
                day: 'monday',
                period: 'period_1',
                location: ''
            });
            this.save();
        },
        
        removeUSchedule(index) {
            this.u_receiving_schedules.splice(index, 1);
            this.save();
        },

        async getMD() {
            const database = new Databases(appw);
            const storage = new Storage(appw);
            
            let k = await database.listDocuments(config.website_db, config.workers, [Query.equal("$id", this.$route.params.id)]);
            
            if (k.documents.length > 0) {
                const doc = k.documents[0];
                this.worker_name_hu = doc.worker_name_hu || "";
                this.worker_name_rs = doc.worker_name_rs || "";
                this.contact = doc.contact || "";
                
                // Parse schedules
                try {
                    if (doc.p_receiving_schedules && typeof doc.p_receiving_schedules === 'string') {
                        this.p_receiving_schedules = JSON.parse(doc.p_receiving_schedules);
                    } else {
                        this.p_receiving_schedules = [];
                    }
                } catch (e) {
                    this.p_receiving_schedules = [];
                }
                
                try {
                    if (doc.u_receiving_schedules && typeof doc.u_receiving_schedules === 'string') {
                        this.u_receiving_schedules = JSON.parse(doc.u_receiving_schedules);
                    } else {
                        this.u_receiving_schedules = [];
                    }
                } catch (e) {
                    this.u_receiving_schedules = [];
                }

                if (doc.worker_img == null || doc.worker_img == '') {
                    this.img = storage.getFileView(config.website_images, config.missing_worker_picture);
                } else {
                    this.img = storage.getFileView(config.website_images, doc.worker_img).toString();
                }
            }
        },

        async save() {
            const database = new Databases(appw);
            
            try {
                const result = await database.updateDocument(
                    config.website_db,
                    config.workers,
                    this.$route.params.id,
                    {
                        worker_name_hu: this.worker_name_hu,
                        worker_name_rs: this.worker_name_rs,
                        worker_img: this.default_img_link || undefined,
                        contact: this.contact,
                        p_receiving_schedules: JSON.stringify(this.p_receiving_schedules),
                        u_receiving_schedules: JSON.stringify(this.u_receiving_schedules)
                    }
                );
                this.$notify(this.$t('saved'));
            } catch (error) {
                console.error('Error saving:', error);
            }
        },

        async delete_content() {
            const database = new Databases(appw);
            await database.deleteDocument(config.website_db, config.workers, this.$route.params.id);
            this.$notify(this.$t('deleted'));
            this.$router.push("/about/workers");
        },

        async file_upload() {
            if (!this.file_link) {
                return;
            }

            const storage = new Storage(appw);
            const result = await storage.createFile(
                config.website_images,
                ID.unique(),
                this.file_link
            );
            this.default_img_link = result.$id;
            this.save();
            this.getMD();
            this.$notify(this.$t('file_uploaded'));
        }
    }
}
</script>