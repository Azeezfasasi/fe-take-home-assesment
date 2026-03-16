<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header -->
    <header class="bg-white shadow-md border-b-4 border-blue-600">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <h1 class="text-2xl md:text-4xl font-bold text-slate-800 flex items-center gap-3">
          <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          NewGlobe Battery Health Monitor
        </h1>
        <p class="text-slate-600 mt-2">Field Support Tool - Identify Schools Needing Device Maintenance</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Total Schools</p>
          <p class="text-4xl font-bold text-blue-600 mt-2">{{ schools.length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Schools with Issues</p>
          <p class="text-4xl font-bold text-red-600 mt-2">{{ schoolsWithIssues }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Unhealthy Devices Total</p>
          <p class="text-4xl font-bold text-yellow-600 mt-2">{{ totalUnhealthyDevices }}</p>
        </div>
      </div>

      <!-- Schools List -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-slate-800 text-white">
          <h2 class="text-[20px] md:text-2xl font-bold">Schools Ranked by Priority</h2>
          <p class="text-slate-300 text-sm mt-1">Schools with the most unhealthy devices should be visited first</p>
        </div>

        <div v-if="schools.length === 0" class="p-8 text-center text-slate-500">
          <p>No battery data available</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-blue-50 bg-blue-50">
                <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700">Priority</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700">School ID</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Total Devices</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Unhealthy</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">% Unhealthy</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Unknown</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(school, index) in schools"
                :key="school.academyId"
                class="border-b border-slate-200 hover:bg-blue-50 transition cursor-pointer"
                @click="goToSchool(school.academyId)"
              >
                <td class="px-6 py-4">
                  <span v-if="index === 0" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold">1</span>
                  <span v-else-if="index === 1" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold">2</span>
                  <span v-else-if="index === 2" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold">3</span>
                  <span v-else class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-400 text-white font-bold">{{ Number(index) + 1 }}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-800">
                  Academy #{{ school.academyId }}
                </td>
                <td class="px-6 py-4 text-center text-slate-700">
                  {{ school.totalDevices }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="school.unhealthyDevices > 0"
                    class="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold"
                    :class="school.unhealthyDevices > 5 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'"
                  >
                    {{ school.unhealthyDevices }}
                  </span>
                  <span v-else class="text-green-600 font-semibold">✓ Healthy</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        class="h-full transition-all"
                        :class="school.percentUnhealthy > 50 ? 'bg-red-600' : school.percentUnhealthy > 25 ? 'bg-yellow-500' : 'bg-green-500'"
                        :style="{ width: school.percentUnhealthy + '%' }"
                      />
                    </div>
                    <span class="text-sm font-semibold text-slate-700 w-12">{{ school.percentUnhealthy }}%</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span v-if="school.unknownDevices > 0" class="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-700 text-sm font-semibold rounded">
                    {{ school.unknownDevices }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click.stop="goToSchool(school.academyId)"
                    class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                  >
                    View
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="font-bold text-slate-800 mb-2">About this Dashboard</h3>
        <p class="text-slate-700 text-sm">
          This tool ranks schools by battery health issues. Devices consuming more than 30% of battery per day are flagged for replacement.
          The ranking helps field teams prioritize which schools to visit first for maintenance support.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { analyzeBatteryHealth } from '@/services/batteryService';
import type { SchoolBatteryData } from '@/services/batteryService';

const router = useRouter();
const schools = ref<SchoolBatteryData[]>([]);

onMounted(() => {
  schools.value = analyzeBatteryHealth();
});

const schoolsWithIssues = computed(() => {
  return schools.value.filter((s: SchoolBatteryData) => s.unhealthyDevices > 0).length;
});

const totalUnhealthyDevices = computed(() => {
  return schools.value.reduce((sum: number, s: SchoolBatteryData) => sum + s.unhealthyDevices, 0);
});

function goToSchool(academyId: number) {
  router.push({ name: 'SchoolDetail', params: { academyId } });
}
</script>

<style scoped>
/* Styles handled by Tailwind CSS */
</style>
