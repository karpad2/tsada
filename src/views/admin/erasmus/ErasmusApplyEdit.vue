<template>
    <section class="page-shell">
        <div class="page-panel container">
            <div class="page-header">
                <h1 id="render_title" class="section-title !text-2xl sm:!text-3xl">{{ $t("erasmus_apply") }}</h1>
                <div class="section-accent !w-20"></div>
            </div>

            <div class="pb-2 w-full dark:text-white">
                <v-form ref="form">
                    <!-- Form fields for name, email, phone, mark, motivation letter, positive document, and class -->
                    <v-text-field required @change="save" v-model="name" :label="$t('name')"></v-text-field>

                    <v-text-field required @change="save" v-model="phone" :label="$t('phone')"></v-text-field>

                    <v-text-field required @change="save" v-model="email" :label="$t('email')"></v-text-field>

                    <v-text-field required @change="save" v-model="mark" :label="$t('mark')"></v-text-field>

                    <v-text-field required @change="calculateScore" v-model="motivation_letter" :label="$t('motivation_letter_score')"></v-text-field>

                    <v-text-field required @change="calculateScore" v-model="positive_document" :label="$t('positive_document_score')"></v-text-field>

                    <v-text-field required v-model="which_class" :label="$t('class_example')"></v-text-field>

                    <!-- Score is automatically calculated and displayed as read-only -->
                    <v-text-field v-model="score" :label="$t('calculated_score')" readonly></v-text-field>

                    <!-- Submit button to save the data -->
                    <v-btn @click="save">{{ $t('submit') }}</v-btn>
                </v-form>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { Databases, ID, Storage, Query } from "appwrite";
import { useLoadingStore } from "@/stores/loading";
import { appw, config } from "@/appwrite";

const database = new Databases(appw);

export default {
    data() {
        return {
            // Form data fields
            name: "",
            email: "",
            phone: "",
            score: "", // This will hold the calculated score
            which_class: "", // Class field
            location: "",
            mark: null,  // Single mark for scoring
            motivation_letter: 0,
            positive_document: 0,
            video_link: "",
        }
    },
    methods: {
        async save() {


            // Calculate the score before saving
            //this.calculateScore();

            try {
                // Update the Erasmus application document with the form data and calculated score
                const result = await database.updateDocument(
                    config.website_db,         // Database ID
                    config.erasmus_applies,    // Collection ID
                    this.$route.params.id,     // Document ID (from route parameters)
                    {
                        name: this.name,
                        phone: this.phone,
                        email: this.email,
                        class: this.which_class,        // Class value
                        erasmusLocation: this.location, // Location value
                        mark: this.mark,                // Mark value
                        motivation_letter: this.motivation_letter,  // Motivational Letter Score
                        positive_document: this.positive_document,  // Positive Document Score
                        score: this.score               // The calculated score
                    }
                );

                // Notify the user of success
                this.$notify(this.$t('apply_saved'));
            } catch (error) {
                // Handle any errors during the document update
                console.error('Error saving data:', error);
                this.$notify({
                    type: 'error',
                    text: this.$t('error_saving')
                });
            }
        },
        calculateScore() {
            if(this.motivation_letter==null) return;
            // Parse input values to ensure they are numbers
            const mark = parseFloat(this.mark);
            const motivationLetter = parseFloat(this.motivation_letter);
            const positiveDocument = parseFloat(this.positive_document);
            const studentClass = this.which_class.trim().toUpperCase();

            // Assign class weightings based on the student's class
            let classWeight = 1; // Default weight for unrecognized classes
            if (studentClass.includes("IV")) {
                classWeight = 1.2; // Higher weight for 4th class
            } else if (studentClass.includes("III")) {
                classWeight = 1.1; // Moderate weight for 3rd class
            } else if (studentClass.includes("II")) {
                classWeight = 1; // Default weight for 2nd class
            }

            // Bonus points logic based on the mark
            let bonus = 0;
            if (mark > 4.5) {
                bonus = 4;
            } else if (mark > 4.0) {
                bonus = 2;
            } else if (mark > 3.5) {
                bonus = 1;
            }

            // Apply class weighting to the mark
            const weightedMark = mark * classWeight;

            // Scale the weighted mark to the 100-point system
            const scaledMark = (weightedMark * 20) ;

            // Calculate the final score
            const finalScore = (scaledMark * 0.5) + (motivationLetter * 2) + (positiveDocument * 2);

            // Update the score field
            this.score = finalScore.toFixed(2);

            this.save();
        },
        async getData() {

            const loadingStore = useLoadingStore();
            
            // Fetch the document data using the document ID from the route params
            let n = await database.getDocument(config.website_db, config.erasmus_applies, this.$route.params.id);
            
            // Populate the form with the fetched data
            this.name = n.name;
            this.phone = n.phone;
            this.email = n.email;
            this.mark = n.mark;
            this.score = n.score;
            this.which_class = n.class;
            
            // Handle location if it exists
            if (n.erasmusLocation) {
                this.location = n.erasmusLocation.$id;
            }
            
        }
    },
    mounted() {
        this.getData(); // Fetch existing form data when mounted
    }
}
</script>
