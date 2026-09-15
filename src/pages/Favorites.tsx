import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppStore } from '../store';
import { Star, Image as ImageIcon, Film, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDoc as getLocalDoc } from '../lib/idb';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import najeEmptyFavorites from '../assets/icons/naje-empty-favorites.svg';
import najeDocument from '../assets/icons/naje-document.svg';

const LocalFavMediaRenderer = ({ fav }: { fav: any }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (fav.message.mediaUrl) {
      if (fav.message.mediaUrl.startsWith('local:')) {
        const localId = fav.message.mediaUrl.split('local:')[1];
        getLocalDoc(localId).then(b64 => {
          if (active && b64) {
            setSrc(b64.startsWith('data:') || b64.startsWith('http') ? b64 : `data:image/jpeg;base64,${b64}`);
          }
        }).catch(console.error);
      } else {
        setSrc(fav.message.mediaUrl.startsWith('data:') || fav.message.mediaUrl.startsWith('http') ? fav.message.mediaUrl : `data:image/jpeg;base64,${fav.message.mediaUrl}`);
      }
    }
    return () => { active = false; };
  }, [fav.message.mediaUrl]);

  if (!src) return <div className="w-full h-full flex items-center justify-center text-xs text-gray-800 dark:text-gray-400 ">جاري التحميل...</div>;

  return <img src={src} alt="Favorite" className="w-full h-full object-cover" />;
};
import { exportSingleImagePDF } from '../utils/pdfExport';

export default function Favorites() {
  const { user } = useAppStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      
      const favs = await Promise.all(snap.docs.map(async (d) => {
        const favData = d.data();
        const msgRef = doc(db, 'messages', favData.messageId);
        const msgSnap = await getDoc(msgRef);
        if (msgSnap.exists()) {
          const msgData = msgSnap.data();
          const chatRef = doc(db, 'chats', msgData.chatId);
          const chatSnap = await getDoc(chatRef);
          return {
            id: d.id,
            ...favData,
            message: { id: msgSnap.id, ...msgData },
            chat: chatSnap.exists() ? { id: chatSnap.id, ...chatSnap.data() } : null
          };
        }
        return null;
      }));
      
      setFavorites((favs.filter(f => f !== null) as any[]).sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  const handleExportFavPDF = async (fav: any) => {
    if (!fav.message?.mediaUrl) return;
    try {
      setExportingId(fav.id);
      let realUrl = fav.message.mediaUrl;
      if (realUrl.startsWith('local:')) {
        const b64 = await getLocalDoc(realUrl.split('local:')[1]);
        if (b64) realUrl = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
      }
      await exportSingleImagePDF(
        realUrl,
        fav.message.content || 'تصميم محفوظ بالمفضلة',
        fav.chat?.title || 'نموذج توليد ناجي',
        fav.message.createdAt,
        fav.chat?.title || 'عام'
      );
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير التصميم كـ PDF');
    } finally {
      setExportingId(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><NajeSpinner className="w-8 h-8" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        <h1 className="text-3xl font-bold">المفضلة</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-[#f2f0f5] dark:bg-gray-900/30 rounded-2xl border border-purple-200 dark:border-gray-800/50 flex flex-col items-center justify-center p-6">
          <img src={najeEmptyFavorites} alt="لا توجد عناصر مفضلة" className="w-48 h-36 mx-auto mb-3 object-contain" />
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">لا توجد عناصر مفضلة</h3>
          <p className="text-gray-800 dark:text-gray-400 text-sm">احفظ الصور والفيديوهات والنصوص التي تعجبك لسهولة الوصول إليها لاحقاً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(fav => (
            <div key={fav.id} className="bg-[#f2f0f5] dark:bg-gray-900 border border-purple-200/80 dark:hover:border-gray-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition flex flex-col">
              {fav.message.mediaUrl ? (
                <div className="aspect-square bg-white dark:bg-gray-950 relative">
                  <LocalFavMediaRenderer fav={fav} />
                  <div className="absolute top-2 right-2 bg-white dark:bg-black/50 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-medium">
                    {fav.chat?.type === 'video' ? <Film className="w-3 h-3 text-purple-600 dark:text-purple-400" /> : <ImageIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                    {fav.chat?.type === 'video' ? 'فيديو' : 'صورة'}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white dark:bg-gray-950 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-400 mb-3">
                    <FileText className="w-3 h-3" /> نص
                  </div>
                  <p className="text-gray-900 dark:text-gray-300 text-sm line-clamp-6">{fav.message.content}</p>
                </div>
              )}
              
              <div className="p-4 border-t border-purple-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <Link to={`/chat/${fav.message.chatId}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    عرض في الدردشة &rarr;
                  </Link>
                  {fav.message.mediaUrl && fav.chat?.type !== 'video' && (
                    <button 
                      onClick={() => handleExportFavPDF(fav)}
                      disabled={exportingId === fav.id}
                      className="text-xs bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-400 dark:border-indigo-500/20 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {exportingId === fav.id ? (
                        <NajeSpinner className="w-3 h-3" />
                      ) : (
                        <>
                          <img src={najeDocument} alt="" className="w-3.5 h-3.5 object-contain" />
                          <span>تصدير PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-400 ">
                  {new Date(fav.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
