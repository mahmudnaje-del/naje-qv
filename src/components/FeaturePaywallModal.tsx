import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, X, ArrowLeft } from 'lucide-react';
import { GatedFeature, FEATURE_MIN_TIER, TIER_UNLOCK_PACKAGE } from '../lib/featureAccess';
import { PACKAGE_CONTENT, StorePackage } from '../pages/Store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: GatedFeature;
}

const FEATURE_LABELS: Record<GatedFeature, string> = {
  creativelyAI: 'Creatively AI',
  najeAgent: 'Naje AI Agent',
  najeAd: 'Naje Ad',
};

const FALLBACK_PRICES: Record<string, number> = {
  pkg_5: 5,
  pkg_10: 10,
  pkg_20: 20,
};

export default function FeaturePaywallModal({ isOpen, onClose, feature }: Props) {
  const [packages, setPackages] = useState<StorePackage[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/paypal/config');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.packages)) {
            setPackages(data.packages);
          }
        }
      } catch (err) {
        console.warn('Could not fetch packages in FeaturePaywallModal:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isOpen) return null;

  const requiredPackageId = TIER_UNLOCK_PACKAGE[FEATURE_MIN_TIER[feature]];
  const content = PACKAGE_CONTENT[requiredPackageId];
  const pkgFromConfig = packages.find(p => p.id === requiredPackageId);
  const displayPrice = pkgFromConfig?.usd ?? FALLBACK_PRICES[requiredPackageId] ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#0b0c10] border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-white transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-extrabold text-white mb-1.5">
          {FEATURE_LABELS[feature]} تحتاج ترقية
        </h2>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          هاي الأداة متاحة بعد الاشتراك بباقة {content?.name}. اشترك مرة وحدة
          واستخدمها براحتك.
        </p>

        {content && (
          <div className="bg-[#12141a] border border-gray-800 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{content.name}</span>
              <span className="text-amber-300 font-mono font-extrabold text-sm">
                ${displayPrice}
              </span>
            </div>
            <ul className="space-y-1.5">
              {content.features.slice(0, 3).map((f, i) => (
                <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          to={`/store?highlight=${requiredPackageId}`}
          onClick={onClose}
          className="w-full bg-gradient-to-l from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold py-3 rounded-xl transition shadow-md shadow-amber-500/20 flex justify-center items-center gap-1.5 cursor-pointer"
        >
          <span>افتح هذه الميزة الآن</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
