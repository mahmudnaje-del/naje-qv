import { TranslationSchema } from '../types';
import { en } from './en';

export const id: TranslationSchema = {
  ...en,
  common: {
    ...en.common,
    welcomeUser: 'Halo, {{name}}',
  },
  onboarding: {
    ...en.onboarding,
    welcomeTitle: 'Selamat datang di NAJE Studio',
    welcomeSubtitle: 'Platform AI yang mengubah ide menjadi produksi nyata.',
    step1Title: 'Tempat ide Anda dimulai',
    step1Desc: 'NAJE menyatukan percakapan, perencanaan, konten, desain, iklan, video, suara, dokumen, dan perangkat lunak.',
    step1CardTitle: 'Dirancang untuk produksi',
    step1CardDesc: 'Bukan sekadar jendela chat — memahami, merencanakan, menghasilkan, dan mengolah hasil.',
    step2Title: 'Studio',
    step2Desc: 'Setiap produk punya alurnya: agen, prompt, iklan, motion, CV, kode, dan sumber.',
    finishBtn: 'Mulai berkarya',
    completedToast: 'Tur selesai. Selamat datang di NAJE Studio.',
  },
  najeModules: {
    najeAgentDesc: 'Sistem agen yang membagi, merencanakan, dan menjalankan tugas dengan alat khusus.',
    najePromptDesc: 'Ubah ide awal menjadi permintaan yang jelas dan lengkap.',
    najeAdDesc: 'Studio iklan dari konsep hingga adegan dan hasil akhir.',
    najeMotionDesc: 'Rencana profesional untuk intro, outro, dan gerak visual.',
    najeCvDesc: 'CV profesional dengan bantuan kompatibilitas ATS.',
    najeDeveloperDesc: 'Unggah proyek, diskusikan kode, tingkatkan, lalu ekspor.',
    najeSourceDesc: 'Ngobrol dengan AI hanya berdasarkan sumber yang Anda pilih.',
    creativeStudioDesc: 'Ide, desain, identitas visual, dan materi pemasaran.',
    creativeAiDesc: 'Konten, desain, dan identitas merek dari satu tempat.',
  },
};
