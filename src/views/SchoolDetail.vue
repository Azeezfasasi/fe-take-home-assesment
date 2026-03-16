<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header with Back Button -->
    <header class="bg-white shadow-md border-b-4 border-blue-600 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div class="flex flex-col-reverse md:flex-row items-center gap-4">
          <button
            @click="goBack"
            class="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-semibold border border-blue-400"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 class="text-3xl font-bold text-slate-800">
            School #{{ academyId }} - Device Health Details
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- School Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Total Devices</p>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ schoolData?.totalDevices || 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Needs Replacement</p>
          <p class="text-3xl font-bold text-red-600 mt-2">{{ schoolData?.unhealthyDevices || 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Unknown Status</p>
          <p class="text-3xl font-bold text-yellow-600 mt-2">{{ unknownCount }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <p class="text-slate-600 text-sm font-semibold uppercase">Healthy Devices</p>
          <p class="text-3xl font-bold text-green-600 mt-2">{{ healthyCount }}</p>
        </div>
      </div>

      <!-- Devices Table -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-slate-800 text-white">
          <h2 class="text-2xl font-bold">Devices in School #{{ academyId }}</h2>
          <p class="text-slate-300 text-sm mt-1">Sorted by health priority</p>
        </div>

        <div v-if="!schoolData || schoolData.deviceDetails.length === 0" class="p-8 text-center text-slate-500">
          <p>No devices found for this school</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-blue-50 bg-blue-50">
                <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700">Device Serial</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Daily Usage</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Readings</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-slate-700">Time Span</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="device in schoolData?.deviceDetails"
                :key="device.serialNumber"
                class="border-b border-slate-200 hover:bg-blue-50 transition"
              >
                <td class="px-6 py-4 font-mono text-sm font-semibold text-slate-800">
                  {{ device.serialNumber }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                    :class="getStatusBadgeClass(device.status)"
                  >
                    {{ getStatusText(device.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span v-if="device.dailyUsagePercentage !== null" class="font-semibold text-slate-700">
                    {{ device.dailyUsagePercentage.toFixed(1) }}%
                  </span>
                  <span v-else class="text-slate-400">Unknown</span>
                </td>
                <td class="px-6 py-4 text-center text-slate-700">
                  {{ device.readingCount }}
                </td>
                <td class="px-6 py-4 text-center text-slate-700">
                  {{ device.timeSpanHours }}h
                </td>
                <td class="px-6 py-4">
                  <span :class="getRecommendationClass(device.status)">
                    {{ getRecommendation(device.status, device.dailyUsagePercentage) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Information Panel -->
      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- How Calculation Works -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How I Calculate Battery Health
          </h3>
          <ul class="list-disc list-inside text-slate-700 text-sm space-y-2">
            <li>I track battery levels across all recorded readings for each device</li>
            <li>Charging events (battery increasing) are excluded from calculations</li>
            <li>I calculate daily average usage by normalizing all intervals to 24 hours</li>
            <li>Longer observation periods carry more weight in the calculation</li>
            <li>Devices with only 1 reading show as "Unknown"</li>
          </ul>
        </div>

        <!-- Action Items -->
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Field Team Action Items
          </h3>
          <ul class="list-disc list-inside text-slate-700 text-sm space-y-2">
            <li><strong class="text-red-600">Red devices:</strong> Prioritize for battery replacement immediately</li>
            <li><strong class="text-yellow-600">Yellow devices:</strong> Monitor closely, prepare for replacement</li>
            <li><strong class="text-gray-700">Gray devices:</strong> Need more data collection (insufficient readings)</li>
            <li>Review device serial numbers with multiple employees for proper assignment</li>
            <li>Document battery replacement dates for future reference</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { analyzeBatteryHealth } from '@/services/batteryService';
import type { SchoolBatteryData, DeviceHealthMetrics } from '@/services/batteryService';

const router = useRouter();
const route = useRoute();
const academyId = ref<number>(0);
const schoolData = ref<SchoolBatteryData | null>(null);

onMounted(() => {
  const id = parseInt(route.params.academyId as string);
  academyId.value = id;

  const allSchools = analyzeBatteryHealth();
  schoolData.value = allSchools.find((s) => s.academyId === id) || null;
});

const unknownCount = computed(() => {
  return schoolData.value?.deviceDetails.filter((d: DeviceHealthMetrics) => d.status === 'unknown').length || 0;
});

const healthyCount = computed(() => {
  return schoolData.value?.deviceDetails.filter((d: DeviceHealthMetrics) => d.status === 'healthy').length || 0;
});

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'unhealthy':
      return 'bg-red-100 text-red-800';
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'unknown':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'unhealthy':
      return '🔴 Needs Replacement';
    case 'healthy':
      return '✅ Healthy';
    case 'unknown':
      return '❓ Unknown';
    default:
      return status;
  }
}

function getRecommendationClass(status: string): string {
  switch (status) {
    case 'unhealthy':
      return 'text-red-700 font-semibold';
    case 'healthy':
      return 'text-green-700 font-semibold';
    case 'unknown':
      return 'text-yellow-700 font-semibold';
    default:
      return 'text-slate-700';
  }
}

function getRecommendation(status: string, dailyUsage: number | null): string {
  switch (status) {
    case 'unhealthy':
      return `⚠️ Replace immediately (${dailyUsage?.toFixed(1)}% daily usage)`;
    case 'healthy':
      return `✓ Continue monitoring`;
    case 'unknown':
      return `Collect more data (need 2+ readings)`;
    default:
      return 'Review status';
  }
}

function goBack() {
  router.push('/');
}
</script>

<style scoped>
/* Styles handled by Tailwind CSS */
</style>
