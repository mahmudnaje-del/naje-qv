import fs from 'fs';

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

if (!content.includes("import NajeSelect")) {
  content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport NajeSelect from '../components/NajeSelect';");
}

let newUsersSelect = `<NajeSelect
                value={usersFilter}
                onChange={(val) => setUsersFilter(val)}
                options={[
                  { value: 'all', label: 'كل المستخدمين' },
                  { value: 'active', label: 'النشطين (خلال 30 يوم)' },
                  { value: 'inactive', label: 'غير النشطين' }
                ]}
                className="w-[180px]"
              />`;
content = content.replace(/<select\s+value=\{usersFilter\}[\s\S]*?<\/select>/, newUsersSelect);

let newSortSelect = `<NajeSelect
                value={usersSort}
                onChange={(val) => setUsersSort(val)}
                options={[
                  { value: 'newest', label: 'الأحدث أولاً' },
                  { value: 'oldest', label: 'الأقدم أولاً' },
                  { value: 'most_points', label: 'الأكثر رصيداً' },
                  { value: 'least_points', label: 'الأقل رصيداً' }
                ]}
                className="w-[180px]"
              />`;
content = content.replace(/<select\s+value=\{usersSort\}[\s\S]*?<\/select>/, newSortSelect);

let newRoleSelect = `<NajeSelect
                value={usersRoleFilter}
                onChange={(val) => setUsersRoleFilter(val)}
                options={[
                  { value: 'all', label: 'جميع الأدوار' },
                  { value: 'admin', label: 'المدراء فقط' },
                  { value: 'user', label: 'المستخدمين العاديين' }
                ]}
                className="w-[180px]"
              />`;
content = content.replace(/<select\s+value=\{usersRoleFilter\}[\s\S]*?<\/select>/, newRoleSelect);

let newBalanceSelect = `<NajeSelect
                value={usersBalanceFilter}
                onChange={(val) => setUsersBalanceFilter(val)}
                options={[
                  { value: 'all', label: 'جميع الأرصدة' },
                  { value: 'zero', label: 'رصيد صفر' },
                  { value: 'low', label: 'رصيد منخفض (< 10)' },
                  { value: 'high', label: 'رصيد مرتفع (> 100)' }
                ]}
                className="w-[180px]"
              />`;
content = content.replace(/<select\s+value=\{usersBalanceFilter\}[\s\S]*?<\/select>/, newBalanceSelect);

fs.writeFileSync('src/pages/Admin.tsx', content);
