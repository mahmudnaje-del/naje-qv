import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useState, useEffect } from 'react';

export interface FeatureFlags {
  voiceChatEnabled: boolean;
  uiStudioEnabled: boolean;
  pdfSlidesEnabled: boolean;
  videoGenerationEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voiceChatEnabled: true,
  uiStudioEnabled: true,
  pdfSlidesEnabled: true,
  videoGenerationEnabled: true,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'feature_flags'), (snap) => {
      if (snap.exists()) {
        setFlags({ ...DEFAULT_FEATURE_FLAGS, ...snap.data() });
      } else {
        setFlags(DEFAULT_FEATURE_FLAGS);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error loading feature flags:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { flags, loading };
}
