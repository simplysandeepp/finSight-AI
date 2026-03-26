import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ExecutiveReport = ({ disabled }) => {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    const target = document.getElementById('dashboard-export-area');
    if (!target) return;

    setGenerating(true);
    try {
      // Render at 3× resolution — razor-sharp fonts and borders
      const canvas = await html2canvas(target, {
        backgroundColor: '#050505',  // match Glossy Black theme
        scale: 3,
        useCORS: true,
        logging: false,
        removeContainer: true,
      });

      // Use JPEG at 0.92 quality to keep PDF under 2MB
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgWidth  = canvas.width;
      const imgHeight = canvas.height;

      // A4 dimensions in mm
      const pdfWidth  = 210;
      const pdfHeight = 297;

      // Calculate scale to fit within A4 preserving aspect ratio
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledW = imgWidth  * ratio;
      const scaledH = imgHeight * ratio;

      const pdf = new jsPDF({
        orientation: scaledH > scaledW ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const xOffset = (pdf.internal.pageSize.getWidth()  - scaledW) / 2;
      const yOffset = 10;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, scaledW, scaledH);
      pdf.save(`FinSight_Executive_Report_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || generating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
        bg-gradient-to-r from-silver-300 to-silver-400
        bg-gradient-to-r from-[#8892a4] to-[#6b7280]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.5)]
        hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {generating ? 'Generating...' : 'Export PDF'}
    </button>
  );
};

export default ExecutiveReport;
