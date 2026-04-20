import Link from "next/link";
import { TEMPLATE_LIST } from "@/lib/templates";
import { SilhouettePreview } from "@/components/SilhouettePreview";

export default function Home() {
  return (
    <main className="flex-1 w-full pt-safe pb-safe">
      <div className="mx-auto max-w-xl px-5 py-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            UPS / Inverter / Rectifier
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight">
            Photo Studio
          </h1>
          <p className="mt-2 text-neutral-400 text-sm">
            Cihaz tipini seçin; kamera rehberi ile profesyonel kadraj yapın ve
            sonrasında AI ile çözünürlüğü artırın.
          </p>
        </header>

        <section className="space-y-3">
          {TEMPLATE_LIST.map((t) => (
            <Link
              key={t.id}
              href={`/capture/${t.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 active:scale-[0.99] transition"
            >
              <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-800/60 flex items-center justify-center overflow-hidden">
                <SilhouettePreview template={t} className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-base font-medium">{t.name}</div>
                <div className="text-xs text-neutral-400">{t.description}</div>
              </div>
              <div className="text-neutral-500 group-hover:text-neutral-200 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 6l6 6-6 6"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8">
          <Link
            href="/gallery"
            className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4"
          >
            <div>
              <div className="text-sm font-medium">Galeri</div>
              <div className="text-xs text-neutral-400">
                Kayıtlı çekimleri görüntüle, indir veya paylaş
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 text-neutral-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6l6 6-6 6"
              />
            </svg>
          </Link>
        </section>

        <p className="mt-10 text-center text-xs text-neutral-600">
          Tamamen tarayıcıda çalışır · Veri cihazınızdan çıkmaz
        </p>
      </div>
    </main>
  );
}
