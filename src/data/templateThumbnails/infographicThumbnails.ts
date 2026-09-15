// SVG Vector Thumbnails for Infographic Templates (Crystal clear, instant load, zero network latency)

function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const INFOGRAPHIC_THUMBNAILS: Record<string, string> = {
  infographic_stats_grid: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg1)"/>
      <rect x="20" y="20" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="36" fill="#fbbf24" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">مؤشرات الأداء الرئيسية</text>
      <!-- 3 Stat Cards -->
      <g transform="translate(20, 56)">
        <rect width="84" height="120" rx="10" fill="#181534" stroke="#6366f1" stroke-opacity="0.25"/>
        <text x="42" y="48" fill="url(#gold)" font-size="22" font-weight="900" text-anchor="middle" font-family="sans-serif">94%</text>
        <text x="42" y="74" fill="#cbd5e1" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">نسبة الرضا</text>
        <rect x="18" y="90" width="48" height="14" rx="7" fill="#10b981" fill-opacity="0.2"/>
        <text x="42" y="100" fill="#10b981" font-size="8" font-weight="bold" text-anchor="middle">▲ +12%</text>
      </g>
      <g transform="translate(118, 56)">
        <rect width="84" height="120" rx="10" fill="#181534" stroke="#fbbf24" stroke-opacity="0.3"/>
        <text x="42" y="48" fill="#38bdf8" font-size="22" font-weight="900" text-anchor="middle" font-family="sans-serif">3.8M</text>
        <text x="42" y="74" fill="#cbd5e1" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">المستخدمين</text>
        <rect x="18" y="90" width="48" height="14" rx="7" fill="#38bdf8" fill-opacity="0.2"/>
        <text x="42" y="100" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="middle">▲ قياسي</text>
      </g>
      <g transform="translate(216, 56)">
        <rect width="84" height="120" rx="10" fill="#181534" stroke="#6366f1" stroke-opacity="0.25"/>
        <text x="42" y="48" fill="url(#gold)" font-size="22" font-weight="900" text-anchor="middle" font-family="sans-serif">15ms</text>
        <text x="42" y="74" fill="#cbd5e1" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">زمن الاستجابة</text>
        <rect x="18" y="90" width="48" height="14" rx="7" fill="#10b981" fill-opacity="0.2"/>
        <text x="42" y="100" fill="#10b981" font-size="8" font-weight="bold" text-anchor="middle">فائق</text>
      </g>
    </svg>
  `),

  infographic_comparison: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg2)"/>
      <rect x="20" y="20" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="36" fill="#38bdf8" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">مقارنة المؤشرات والخيارات</text>
      <!-- Bars Comparison -->
      <g transform="translate(24, 60)">
        <!-- Bar 1 -->
        <text x="272" y="12" fill="#cbd5e1" font-size="10" font-family="sans-serif" text-anchor="end">الخيار (أ) — المتطور</text>
        <text x="0" y="12" fill="#fbbf24" font-size="10" font-weight="bold" font-family="sans-serif">92%</text>
        <rect x="0" y="18" width="272" height="10" rx="5" fill="#1e1b4b"/>
        <rect x="22" y="18" width="250" height="10" rx="5" fill="linear-gradient(90deg, #6366f1, #fbbf24)"/>

        <!-- Bar 2 -->
        <text x="272" y="48" fill="#cbd5e1" font-size="10" font-family="sans-serif" text-anchor="end">الخيار (ب) — القياسي</text>
        <text x="0" y="48" fill="#38bdf8" font-size="10" font-weight="bold" font-family="sans-serif">68%</text>
        <rect x="0" y="54" width="272" height="10" rx="5" fill="#1e1b4b"/>
        <rect x="87" y="54" width="185" height="10" rx="5" fill="linear-gradient(90deg, #38bdf8, #6366f1)"/>

        <!-- Bar 3 -->
        <text x="272" y="84" fill="#cbd5e1" font-size="10" font-family="sans-serif" text-anchor="end">الخيار (ج) — الأساسي</text>
        <text x="0" y="84" fill="#a855f7" font-size="10" font-weight="bold" font-family="sans-serif">41%</text>
        <rect x="0" y="90" width="272" height="10" rx="5" fill="#1e1b4b"/>
        <rect x="160" y="90" width="112" height="10" rx="5" fill="linear-gradient(90deg, #a855f7, #ec4899)"/>
      </g>
    </svg>
  `),

  infographic_timeline: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg3)"/>
      <rect x="20" y="16" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="32" fill="#fbbf24" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">الخط الزمني وخارطة الطريق</text>
      <!-- Timeline nodes -->
      <g transform="translate(24, 56)">
        <line x1="260" y1="20" x2="260" y2="110" stroke="#6366f1" stroke-width="3" stroke-dasharray="4 4"/>
        
        <!-- Step 1 -->
        <circle cx="260" cy="20" r="12" fill="#fbbf24"/>
        <text x="260" y="24" fill="#0f172a" font-size="10" font-weight="900" text-anchor="middle">1</text>
        <rect x="20" y="8" width="220" height="26" rx="6" fill="#181534" stroke="#6366f1" stroke-opacity="0.25"/>
        <text x="230" y="24" fill="#fbbf24" font-size="10" font-weight="bold" text-anchor="end">مرحلة التأسيس والتجهيز</text>

        <!-- Step 2 -->
        <circle cx="260" cy="65" r="12" fill="#38bdf8"/>
        <text x="260" y="69" fill="#0f172a" font-size="10" font-weight="900" text-anchor="middle">2</text>
        <rect x="20" y="53" width="220" height="26" rx="6" fill="#181534" stroke="#38bdf8" stroke-opacity="0.25"/>
        <text x="230" y="69" fill="#38bdf8" font-size="10" font-weight="bold" text-anchor="end">الإطلاق التجريبي والتحسين</text>

        <!-- Step 3 -->
        <circle cx="260" cy="110" r="12" fill="#10b981"/>
        <text x="260" y="114" fill="#0f172a" font-size="10" font-weight="900" text-anchor="middle">3</text>
        <rect x="20" y="98" width="220" height="26" rx="6" fill="#181534" stroke="#10b981" stroke-opacity="0.25"/>
        <text x="230" y="114" fill="#10b981" font-size="10" font-weight="bold" text-anchor="end">التوسع والانتشار الكامل</text>
      </g>
    </svg>
  `),

  infographic_process_steps: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg4)"/>
      <rect x="20" y="16" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="32" fill="#10b981" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">خطوات العملية المتسلسلة</text>
      <!-- Process Cards -->
      <g transform="translate(20, 54)">
        <rect x="0" y="0" width="86" height="120" rx="10" fill="#181534" stroke="#6366f1" stroke-opacity="0.3"/>
        <circle cx="43" cy="30" r="16" fill="#6366f1"/>
        <text x="43" y="35" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">1</text>
        <text x="43" y="66" fill="#cbd5e1" font-size="10" font-weight="bold" text-anchor="middle">التحليل</text>
        <text x="43" y="85" fill="#64748b" font-size="8" text-anchor="middle">جمع المعطيات</text>

        <rect x="97" y="0" width="86" height="120" rx="10" fill="#181534" stroke="#fbbf24" stroke-opacity="0.4"/>
        <circle cx="140" cy="30" r="16" fill="#fbbf24"/>
        <text x="140" y="35" fill="#0f172a" font-size="12" font-weight="bold" text-anchor="middle">2</text>
        <text x="140" y="66" fill="#fbbf24" font-size="10" font-weight="bold" text-anchor="middle">التنفيذ</text>
        <text x="140" y="85" fill="#64748b" font-size="8" text-anchor="middle">البناء والتطوير</text>

        <rect x="194" y="0" width="86" height="120" rx="10" fill="#181534" stroke="#10b981" stroke-opacity="0.3"/>
        <circle cx="237" cy="30" r="16" fill="#10b981"/>
        <text x="237" y="35" fill="#0f172a" font-size="12" font-weight="bold" text-anchor="middle">3</text>
        <text x="237" y="66" fill="#10b981" font-size="10" font-weight="bold" text-anchor="middle">التسليم</text>
        <text x="237" y="85" fill="#64748b" font-size="8" text-anchor="middle">التشغيل الفوري</text>
      </g>
    </svg>
  `),

  infographic_market_share: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg5)"/>
      <rect x="20" y="16" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="32" fill="#ec4899" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">الحصص السوقية والتوزيع</text>
      <!-- Donut Circle and Legend -->
      <g transform="translate(30, 60)">
        <circle cx="55" cy="55" r="40" fill="transparent" stroke="#1e1b4b" stroke-width="20"/>
        <!-- Segment 1: 50% -->
        <circle cx="55" cy="55" r="40" fill="transparent" stroke="#6366f1" stroke-width="20" stroke-dasharray="125 251" stroke-dashoffset="0"/>
        <!-- Segment 2: 30% -->
        <circle cx="55" cy="55" r="40" fill="transparent" stroke="#fbbf24" stroke-width="20" stroke-dasharray="75 251" stroke-dashoffset="-125"/>
        <!-- Segment 3: 20% -->
        <circle cx="55" cy="55" r="40" fill="transparent" stroke="#38bdf8" stroke-width="20" stroke-dasharray="51 251" stroke-dashoffset="-200"/>

        <!-- Legend -->
        <g transform="translate(130, 10)">
          <rect x="0" y="0" width="10" height="10" rx="3" fill="#6366f1"/>
          <text x="18" y="9" fill="#cbd5e1" font-size="10" font-family="sans-serif">الريادة (50%)</text>

          <rect x="0" y="24" width="10" height="10" rx="3" fill="#fbbf24"/>
          <text x="18" y="33" fill="#cbd5e1" font-size="10" font-family="sans-serif">المنافس الأول (30%)</text>

          <rect x="0" y="48" width="10" height="10" rx="3" fill="#38bdf8"/>
          <text x="18" y="57" fill="#cbd5e1" font-size="10" font-family="sans-serif">بقية السوق (20%)</text>
        </g>
      </g>
    </svg>
  `),

  infographic_before_after: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg6" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1123"/>
          <stop offset="100%" stop-color="#070811"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg6)"/>
      <rect x="20" y="16" width="280" height="24" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-opacity="0.3"/>
      <text x="160" y="32" fill="#fbbf24" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">مقارنة الأداء: قبل وبعد</text>
      <!-- Two Side-by-Side Cards -->
      <g transform="translate(20, 54)">
        <rect x="0" y="0" width="132" height="120" rx="10" fill="#181534" stroke="#ef4444" stroke-opacity="0.3"/>
        <text x="66" y="26" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">قبل التطوير</text>
        <text x="66" y="60" fill="#94a3b8" font-size="20" font-weight="bold" text-anchor="middle">48h</text>
        <text x="66" y="80" fill="#64748b" font-size="9" text-anchor="middle">وقت المعالجة</text>
        <text x="66" y="102" fill="#ef4444" font-size="9" text-anchor="middle">تأخير وتعطيل</text>

        <rect x="148" y="0" width="132" height="120" rx="10" fill="#181534" stroke="#10b981" stroke-opacity="0.4"/>
        <text x="214" y="26" fill="#10b981" font-size="12" font-weight="bold" text-anchor="middle">بعد ناجي AI</text>
        <text x="214" y="60" fill="#fbbf24" font-size="20" font-weight="bold" text-anchor="middle">3 min</text>
        <text x="214" y="80" fill="#cbd5e1" font-size="9" text-anchor="middle">إنجاز فوري دقيق</text>
        <text x="214" y="102" fill="#10b981" font-size="9" font-weight="bold" text-anchor="middle">▲ توفير 96%</text>
      </g>
    </svg>
  `),

  infographic_mixed_hybrid: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bg7" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#14112e"/>
          <stop offset="100%" stop-color="#080714"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#bg7)"/>
      <rect x="18" y="14" width="284" height="22" rx="6" fill="#1e1b4b" stroke="#fbbf24" stroke-opacity="0.4"/>
      <text x="160" y="29" fill="#fbbf24" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">دمج ذكي شامل (Mixed Hybrid)</text>
      
      <!-- Top 2 Stats -->
      <g transform="translate(18, 44)">
        <rect x="0" y="0" width="138" height="42" rx="8" fill="#181534" stroke="#6366f1" stroke-opacity="0.3"/>
        <text x="12" y="26" fill="#fbbf24" font-size="16" font-weight="bold" font-family="sans-serif">+98%</text>
        <text x="126" y="25" fill="#cbd5e1" font-size="9" text-anchor="end">كفاءة الأداء</text>

        <rect x="146" y="0" width="138" height="42" rx="8" fill="#181534" stroke="#38bdf8" stroke-opacity="0.3"/>
        <text x="158" y="26" fill="#38bdf8" font-size="16" font-weight="bold" font-family="sans-serif">4.2x</text>
        <text x="272" y="25" fill="#cbd5e1" font-size="9" text-anchor="end">معدل النمو</text>
      </g>

      <!-- Comparison Bar & Donut Mini Hybrid -->
      <g transform="translate(18, 94)">
        <!-- Left Donut -->
        <rect x="0" y="0" width="100" height="88" rx="8" fill="#181534" stroke="#6366f1" stroke-opacity="0.25"/>
        <circle cx="50" cy="38" r="22" fill="transparent" stroke="#1e1b4b" stroke-width="10"/>
        <circle cx="50" cy="38" r="22" fill="transparent" stroke="#fbbf24" stroke-width="10" stroke-dasharray="80 140" stroke-dashoffset="0"/>
        <circle cx="50" cy="38" r="22" fill="transparent" stroke="#6366f1" stroke-width="10" stroke-dasharray="60 140" stroke-dashoffset="-80"/>
        <text x="50" y="74" fill="#a5b4fc" font-size="8" font-weight="bold" text-anchor="middle">توزيع الحصص</text>

        <!-- Right Process / Bars -->
        <rect x="108" y="0" width="176" height="88" rx="8" fill="#181534" stroke="#6366f1" stroke-opacity="0.25"/>
        <!-- Step 1 -->
        <circle cx="124" cy="22" r="7" fill="#6366f1"/>
        <text x="124" y="25" fill="#fff" font-size="7" font-weight="bold" text-anchor="middle">1</text>
        <rect x="138" y="16" width="134" height="12" rx="3" fill="#1e1b4b"/>
        <rect x="138" y="16" width="115" height="12" rx="3" fill="#6366f1"/>
        
        <!-- Step 2 -->
        <circle cx="124" cy="44" r="7" fill="#fbbf24"/>
        <text x="124" y="47" fill="#0f172a" font-size="7" font-weight="bold" text-anchor="middle">2</text>
        <rect x="138" y="38" width="134" height="12" rx="3" fill="#1e1b4b"/>
        <rect x="138" y="38" width="90" height="12" rx="3" fill="#fbbf24"/>

        <!-- Step 3 -->
        <circle cx="124" cy="66" r="7" fill="#10b981"/>
        <text x="124" y="69" fill="#0f172a" font-size="7" font-weight="bold" text-anchor="middle">3</text>
        <rect x="138" y="60" width="134" height="12" rx="3" fill="#1e1b4b"/>
        <rect x="138" y="60" width="128" height="12" rx="3" fill="#10b981"/>
      </g>
    </svg>
  `)
};
