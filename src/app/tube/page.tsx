// src/app/tube/page.tsx
import type { Metadata } from "next";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "TubeIdea | أدوات عناوين يوتيوب بالعربية",
  description: "عناوين وأوصاف وكلمات مفتاحية لفيديوهات يوتيوب بالعربية، في ثوانٍ. سجّل اهتمامك.",
};

const FEATURES = [
  ["10 عناوين جذابة", "لكل فيديو، بأساليب مختلفة (فضول، أرقام، سؤال) وباللهجة التي تناسب جمهورك."],
  ["وصف جاهز", "وصف مرتب فيه الكلمات المفتاحية وروابطك، وجاهز للنسخ."],
  ["كلمات مفتاحية وهاشتاغات", "قائمة مقترحة لكل فيديو لتحسين الظهور في البحث."],
  ["افتتاحية أول 15 ثانية", "جملة افتتاح تشد المشاهد قبل أن يغادر."],
];

export default function TubePage() {
  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-12">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold tracking-wide text-red-600">TubeIdea · قريبًا</p>
          <h1 className="text-4xl font-extrabold leading-tight">
            اكتب عنوان فيديو يوتيوب ووصفه وكلماته المفتاحية في ثوانٍ، بالعربية
          </h1>
          <p className="text-lg text-slate-600">
            أدخل موضوع الفيديو، فتحصل على عناوين وأوصاف وكلمات مفتاحية جاهزة للنسخ. نبني الأداة الآن،
            ونريد أن نعرف إن كانت مفيدة لك قبل أن نكملها.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-bold">كن من أوائل المجرّبين</h2>
          <WaitlistForm />
          <p className="mt-3 text-sm text-slate-500">
            نستعمل بريدك لإبلاغك بإطلاق الأداة فقط. بلا رسائل مزعجة، ويمكنك طلب الحذف في أي وقت.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">ماذا ستعطيك الأداة</h2>
          <ul className="flex flex-col gap-3">
            {FEATURES.map(([t, d]) => (
              <li key={t} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="font-bold">{t}</p>
                <p className="text-slate-600">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-sm text-slate-500">
          هذه الصفحة لاختبار الاهتمام. لم يُطلق المنتج بعد ولا يوجد دفع حاليًا.
        </footer>
      </div>
    </main>
  );
}
