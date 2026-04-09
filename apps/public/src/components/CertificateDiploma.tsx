import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface CertificateDiplomaProps {
  userName: string;
  audienceLabel: string;
  courseName: string;
  completedDate: string;
  onClose: () => void;
}

function buildPrintDocument(userName: string, audienceLabel: string, courseName: string, completedDate: string): Document {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 297mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
      background: white;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .certificate {
      width: 277mm; height: 190mm; position: relative;
      padding: 24mm 32mm;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; background: white;
    }
    .certificate::before { content: ''; position: absolute; inset: 0; border: 3px solid #111; }
    .certificate::after { content: ''; position: absolute; inset: 6px; border: 1px solid #111; }
    .corner { position: absolute; width: 40px; height: 40px; border-color: #21B2AA; }
    .corner-tl { top: 16px; left: 16px; border-top: 2px solid; border-left: 2px solid; }
    .corner-tr { top: 16px; right: 16px; border-top: 2px solid; border-right: 2px solid; }
    .corner-bl { bottom: 16px; left: 16px; border-bottom: 2px solid; border-left: 2px solid; }
    .corner-br { bottom: 16px; right: 16px; border-bottom: 2px solid; border-right: 2px solid; }
    .logo-text { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 6px; text-transform: uppercase; color: #21B2AA; margin-bottom: 8mm; }
    .title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; letter-spacing: -0.5px; color: #111; margin-bottom: 4mm; }
    .subtitle { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 12mm; }
    .label { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 3mm; }
    .name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: #111; margin-bottom: 8mm; border-bottom: 1px solid #ddd; padding-bottom: 3mm; min-width: 200px; }
    .course-label { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 2mm; }
    .course-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #21B2AA; margin-bottom: 3mm; }
    .audience { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 12mm; }
    .footer { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; padding: 0 8mm; }
    .footer-col { text-align: center; min-width: 50mm; }
    .footer-line { width: 100%; border-top: 1px solid #ccc; margin-bottom: 2mm; }
    .footer-label { font-family: 'Inter', sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #999; }
    .footer-value { font-family: 'Inter', sans-serif; font-size: 11px; color: #333; margin-bottom: 2mm; }
    .seal { width: 50px; height: 50px; border: 2px solid #21B2AA; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .seal-inner { width: 38px; height: 38px; border: 1px solid #21B2AA; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; color: #21B2AA; font-weight: 500; }
  `;

  const doc = document.implementation.createHTMLDocument('Certification DataRing');

  const styleEl = doc.createElement('style');
  styleEl.textContent = css;
  doc.head.appendChild(styleEl);

  const cert = doc.createElement('div');
  cert.className = 'certificate';

  // Corner ornaments
  for (const c of ['tl', 'tr', 'bl', 'br']) {
    const corner = doc.createElement('div');
    corner.className = `corner corner-${c}`;
    cert.appendChild(corner);
  }

  const addDiv = (className: string, text: string) => {
    const el = doc.createElement('div');
    el.className = className;
    el.textContent = text;
    cert.appendChild(el);
  };

  addDiv('logo-text', 'DataRing');
  addDiv('title', 'Certification');
  addDiv('subtitle', 'Acad\u00e9mie de protection num\u00e9rique');
  addDiv('label', 'D\u00e9cern\u00e9 \u00e0');
  addDiv('name', userName);
  addDiv('course-label', 'Pour avoir compl\u00e9t\u00e9 avec succ\u00e8s');
  addDiv('course-name', courseName);
  addDiv('audience', `Parcours ${audienceLabel}`);

  // Footer
  const footer = doc.createElement('div');
  footer.className = 'footer';

  const addFooterCol = (value: string, label: string) => {
    const col = doc.createElement('div');
    col.className = 'footer-col';
    const v = doc.createElement('div');
    v.className = 'footer-value';
    v.textContent = value;
    col.appendChild(v);
    const line = doc.createElement('div');
    line.className = 'footer-line';
    col.appendChild(line);
    const l = doc.createElement('div');
    l.className = 'footer-label';
    l.textContent = label;
    col.appendChild(l);
    return col;
  };

  footer.appendChild(addFooterCol(completedDate, 'Date'));

  // Seal
  const sealCol = doc.createElement('div');
  sealCol.className = 'footer-col';
  const seal = doc.createElement('div');
  seal.className = 'seal';
  const sealInner = doc.createElement('div');
  sealInner.className = 'seal-inner';
  sealInner.textContent = 'DR';
  seal.appendChild(sealInner);
  sealCol.appendChild(seal);
  footer.appendChild(sealCol);

  footer.appendChild(addFooterCol('DataRing', 'Organisme'));
  cert.appendChild(footer);

  doc.body.appendChild(cert);
  return doc;
}

export function CertificateDiploma({ userName, audienceLabel, courseName, completedDate, onClose }: CertificateDiplomaProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus the first button
    const modal = modalRef.current;
    if (modal) {
      const firstBtn = modal.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = buildPrintDocument(userName, audienceLabel, courseName, completedDate);
    const sanitized = DOMPurify.sanitize(doc.documentElement.outerHTML, { WHOLE_DOCUMENT: true });

    const printDoc = printWindow.document;
    printDoc.open();
    printDoc.write(sanitized);
    printDoc.close();

    printWindow.onload = () => printWindow.print();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Certification" className="relative bg-white max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 hover:bg-black/5 transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Certificate preview */}
        <div ref={certRef} className="relative border-[3px] border-black m-6 mb-0">
          <div className="border border-black m-[6px]">
            {/* Corner ornaments */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-brand-turquoise" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-brand-turquoise" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-brand-turquoise" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-brand-turquoise" />

            <div className="flex flex-col items-center text-center py-12 sm:py-16 px-8 sm:px-16">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-brand-turquoise mb-6">
                DataRing
              </span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter mb-2">
                Certification
              </h2>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-black/60 mb-10">
                Académie de protection numérique
              </span>

              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-black/60 mb-2">
                Décerné à
              </span>
              <span className="font-heading font-bold text-2xl tracking-tight border-b border-black/15 pb-2 px-8 mb-8">
                {userName}
              </span>

              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-black/60 mb-1">
                Pour avoir complété avec succès
              </span>
              <span className="font-heading font-bold text-xl tracking-tight text-brand-turquoise mb-1">
                {courseName}
              </span>
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-black/50 mb-10">
                Parcours {audienceLabel}
              </span>

              <div className="flex items-end justify-between w-full max-w-md">
                <div className="text-center min-w-[100px]">
                  <span className="block font-mono text-[11px] text-black/70 mb-1">{completedDate}</span>
                  <div className="border-t border-black/20 pt-1">
                    <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-black/50">Date</span>
                  </div>
                </div>

                <div className="w-12 h-12 border-2 border-brand-turquoise rounded-full flex items-center justify-center mx-6">
                  <div className="w-9 h-9 border border-brand-turquoise rounded-full flex items-center justify-center">
                    <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-brand-turquoise font-medium">DR</span>
                  </div>
                </div>

                <div className="text-center min-w-[100px]">
                  <span className="block font-mono text-[11px] text-black/70 mb-1">DataRing</span>
                  <div className="border-t border-black/20 pt-1">
                    <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-black/50">Organisme</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 p-6">
          <button
            onClick={handlePrint}
            className="px-8 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100"
          >
            Imprimer / Enregistrer PDF
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
