<template>
    <CTabs v-model:activeItemKey="activeTab">

        <CTabList variant="tabs">
            <CTab itemKey="lp">List Participants</CTab>
            <CTab itemKey="cp">Create Participant</CTab>
        </CTabList>

        <CTabContent>

            <!-- List Participants -->
            <CTabPanel class="p-3" itemKey="lp">
                <Participant_list />
            </CTabPanel>

            <!-- Create Participant -->
            <CTabPanel class="p-3" itemKey="cp">
                <participant_create />
            </CTabPanel>

        </CTabContent>

    </CTabs>
</template>

<script setup>
import { ref } from 'vue'
import Participant_list from './participant_list.vue';
import participant_create from './paricipant_create.vue';

const activeTab = ref('lp')
</script>